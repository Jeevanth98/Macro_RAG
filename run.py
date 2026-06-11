import subprocess
import sys

if __name__ == "__main__":
    subprocess.run(
        [
            sys.executable, "-m", "streamlit", "run",
            "economic_graphrag/ui/streamlit_app.py",
            "--server.port", "5000",
            "--server.address", "0.0.0.0",
            "--server.headless", "true",
            "--server.enableCORS", "false",
            "--server.enableXsrfProtection", "false",
        ],
        check=True,
    )
