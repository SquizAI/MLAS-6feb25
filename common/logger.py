import logging

def get_logger(name: str):
    logger = logging.getLogger(name)
    if not logger.handlers:  # Add a handler only if not already added.
        handler = logging.StreamHandler()
        formatter = logging.Formatter('[%(levelname)s] %(asctime)s - %(name)s - %(message)s')
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)
    return logger 