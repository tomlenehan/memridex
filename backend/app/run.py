import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8567,
        log_level="debug",
        reload=True,
        workers=1
    )