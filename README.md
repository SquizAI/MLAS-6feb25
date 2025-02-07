# Life & Business Command Center

This repository contains the microservices for the next-generation Life & Business Command Center – an AI-driven platform that integrates:

- Real-time video meeting analysis (transcription, sentiment, action item extraction)
- Voice-guided workflow creation
- Document management (upload, preview, editing)
- Real-time dashboard visualization with live stats
- Agent interaction & feedback
- Knowledge graph visualization
- Task management with workflow automation
- Multi-agent reinforcement learning & emotional processing

## Getting Started

1. **Install Docker & Docker Compose.**
2. **Build and run:**

   ```bash
   docker-compose up --build
   ```

3. **Access services on the designated ports:**

   - Video Analysis: http://localhost:8001
   - Voice Workflow: http://localhost:8002
   - Document Management: http://localhost:8003
   - Dashboard: http://localhost:8004
   - Agent Interaction: http://localhost:8005
   - Knowledge Graph: http://localhost:8006
   - Task Management: http://localhost:8007
   - ML Emotional Processing: http://localhost:8008

## Development

Each service is built with FastAPI and is designed to be expanded with real production logic. The common configuration and logger are shared in the `common/` directory.

## License

MIT License.
