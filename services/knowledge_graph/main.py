import logging
import uvicorn
import asyncio
from fastapi import FastAPI, WebSocket, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware

logger = logging.getLogger("knowledge_graph")
logging.basicConfig(level=logging.INFO)

app = FastAPI(title="Knowledge Graph Explorer", debug=False)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In production, the graph data would be backed by persistent storage.
graph_data = {
    "nodes": [
        {"id": "task1", "label": "Task 1", "group": "task"},
        {"id": "doc1", "label": "Document 1", "group": "document"},
        {"id": "chat1", "label": "Chat 1", "group": "chat"}
    ],
    "edges": [
        {"from": "task1", "to": "doc1"},
        {"from": "task1", "to": "chat1"}
    ]
}

@app.get("/health", summary="Health Check")
async def health_check():
    return {"status": "ok"}

@app.get("/", response_class=HTMLResponse)
async def graph_page():
    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Knowledge Graph Explorer</title>
        <script src="https://d3js.org/d3.v6.min.js"></script>
        <style>
            .node { cursor: pointer; }
            .link { stroke: #999; stroke-opacity: 0.6; }
        </style>
    </head>
    <body>
        <h1>Knowledge Graph Explorer</h1>
        <svg width="800" height="600"></svg>
        <script>
            fetch('/graph').then(res => res.json()).then(data => {
                const svg = d3.select("svg"),
                      width = +svg.attr("width"),
                      height = +svg.attr("height");

                const simulation = d3.forceSimulation(data.nodes)
                    .force("link", d3.forceLink(data.edges).id(d => d.id).distance(100))
                    .force("charge", d3.forceManyBody().strength(-200))
                    .force("center", d3.forceCenter(width / 2, height / 2));

                const link = svg.append("g")
                    .attr("class", "links")
                    .selectAll("line")
                    .data(data.edges)
                    .enter().append("line")
                    .attr("class", "link");

                const node = svg.append("g")
                    .attr("class", "nodes")
                    .selectAll("circle")
                    .data(data.nodes)
                    .enter().append("circle")
                    .attr("class", "node")
                    .attr("r", 20)
                    .style("fill", d => d.group === "task" ? "#ffab00" : d.group === "document" ? "#00bfa5" : "#2196f3")
                    .call(d3.drag()
                        .on("start", dragstarted)
                        .on("drag", dragged)
                        .on("end", dragended));

                node.append("title").text(d => d.label);

                simulation.nodes(data.nodes).on("tick", ticked);
                simulation.force("link").links(data.edges);

                function ticked() {
                    link.attr("x1", d => d.source.x)
                        .attr("y1", d => d.source.y)
                        .attr("x2", d => d.target.x)
                        .attr("y2", d => d.target.y);
                    node.attr("cx", d => d.x)
                        .attr("cy", d => d.y);
                }
                function dragstarted(event, d) {
                    if (!event.active) simulation.alphaTarget(0.3).restart();
                    d.fx = d.x; d.fy = d.y;
                }
                function dragged(event, d) {
                    d.fx = event.x; d.fy = event.y;
                }
                function dragended(event, d) {
                    if (!event.active) simulation.alphaTarget(0);
                    d.fx = null; d.fy = null;
                }
            }).catch(error => {
                console.error("Error loading graph:", error);
            });
        </script>
    </body>
    </html>
    """
    return HTMLResponse(html_content)

@app.get("/graph", response_class=JSONResponse)
async def get_graph():
    return graph_data

@app.post("/knowledge-graph/update", summary="Update Graph")
async def update_knowledge_graph(node: str, info: str):
    try:
        exists = any(n["id"] == node for n in graph_data["nodes"])
        if not exists:
            graph_data["nodes"].append({"id": node, "label": info, "group": "dynamic"})
            logger.info(f"Added node {node} with info: {info}")
        else:
            logger.info(f"Node {node} already exists; update skipped.")
        return {"status": "node added or exists"}
    except Exception as e:
        logger.exception("Error updating knowledge graph")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@app.websocket("/ws/knowledge-graph")
async def websocket_knowledge_graph(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            await websocket.send_json(graph_data)
            await asyncio.sleep(5)
    except Exception as e:
        logger.exception("WebSocket error in knowledge graph")
        await websocket.close()

if __name__ == "__main__":
    uvicorn.run("services.knowledge_graph.main:app", host="0.0.0.0", port=8006, reload=False) 