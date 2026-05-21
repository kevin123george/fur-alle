import logging
logger = logging.getLogger(__name__)

def run() -> None:
    from fetchers.inkar import run as inkar_run
    inkar_run()
