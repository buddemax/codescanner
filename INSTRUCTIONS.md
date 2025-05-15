cd backend

python3 -m venv venv

source venv/bin/activate     // windows: .\\venv\\Scripts\\Activate.ps1

pip install --upgrade pip

pip install -r requirements.txt

uvicorn main:app --reload

Standardmäßig lauscht der Server auf http://127.0.0.1:8000.

Test