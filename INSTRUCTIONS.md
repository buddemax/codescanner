cd backend

python3 -m venv venv

source venv/bin/activate     // windows: .\\venv\\Scripts\\Activate.ps1

pip install --upgrade pip

pip install -r requirements.txt

uvicorn main:app --reload

Standardmäßig lauscht der Server auf http://127.0.0.1:8000.

Test




cd backend && docker build -t code-scanner-backend:latest .

docker run -d -p 8000:8000 --name code-scanner-backend code-scanner-backend:latest





docker build -t frontend-app -f frontend/Dockerfile .