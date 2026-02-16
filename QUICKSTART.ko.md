# RAG 채팅 시스템 - 빠른 시작 가이드

한국어 | [English](QUICKSTART.md)

이 가이드는 RAG 채팅 시스템을 몇 분 만에 실행하는 데 도움이 됩니다.

## 사전 요구사항

### 공통 요구사항
- Docker 및 Docker Compose 설치
- 최소 8GB RAM 사용 가능 (12GB+ 권장)
- 포트 80 사용 가능 (또는 docker-compose.yml 수정)
- 좋은 인터넷 연결 (약 5.4GB의 모델 다운로드)

### 플랫폼별 요구사항

**NVIDIA GPU가 있는 Linux:**
- 최신 드라이버가 있는 NVIDIA GPU
- `nvidia-container-toolkit` 설치
- 사용: `docker-compose up`

**macOS:**
- Homebrew 설치
- 네이티브 Ollama (brew를 통해 설치)
- 사용: `docker-compose -f docker-compose.yml -f docker-compose.native_ollama.yml up`

## 1단계: 서비스 시작

시스템에 맞는 방법을 선택하세요:

### NVIDIA GPU가 있는 Linux용

**사전 요구사항:**
1. 최신 드라이버가 있는 NVIDIA GPU
2. nvidia-container-toolkit 설치:
   ```bash
   # Ubuntu/Debian
   distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
   curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
   curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | \
     sudo tee /etc/apt/sources.list.d/nvidia-docker.list
   sudo apt-get update && sudo apt-get install -y nvidia-container-toolkit
   sudo systemctl restart docker
   ```

**서비스 시작:**
```bash
# 프로젝트 루트 디렉토리에서
docker-compose up --build
```

성능: GPU 가속으로 ~50-100+ 토큰/초

### macOS용 (네이티브 Ollama를 통한 Metal GPU)

**⚠️ 중요**: macOS 사용자는 반드시 이 방법을 사용해야 합니다. macOS에서 `docker-compose up`을 실행하면 다음 오류가 발생합니다:
```
Error response from daemon: could not select device driver "nvidia" with capabilities: [[gpu]]
```

**설정 및 시작:**
```bash
# 1. Ollama를 네이티브로 설치 및 시작
brew install ollama
ollama serve &
ollama pull qwen3-embedding:0.6b
ollama pull qwen3:8b

# 2. 백엔드와 프론트엔드 시작 (Docker Ollama 제외)
docker-compose -f docker-compose.yml -f docker-compose.native_ollama.yml up --build
```

성능: Metal GPU 가속으로 ~80-150+ 토큰/초

다음을 수행합니다:
1. Ollama 서버 빌드 및 시작
2. **필요한 AI 모델 자동 다운로드** (총 약 5.4GB)
   - qwen3-embedding:0.6b (~400MB) - 텍스트 임베딩용
   - qwen3:8b (~5GB) - 채팅 응답용
3. 백엔드 API 시작 (FastAPI)
4. 프론트엔드 시작 (React + Nginx)

**참고**: 첫 번째 시작은 인터넷 연결에 따라 모델을 다운로드하는 데 5-10분이 걸립니다. 이후 시작은 모델이 캐시되므로 훨씬 빠릅니다.

## 2단계: 모델 다운로드 대기

로그에서 다음 메시지를 확인하세요:
```
ollama  | ✅ Embedding model downloaded!
ollama  | ✅ LLM model downloaded!
ollama  | 🎉 All models ready!
```

또는 모델 상태를 확인하세요:
```bash
docker exec -it rag_ollama ollama list
```

두 모델이 나열되어야 합니다:
- qwen3-embedding:0.6b
- qwen3:8b

### GPU 사용 확인 (GPU 모드만)

GPU가 사용되는지 확인:
```bash
# 로그에서 GPU 감지 확인
docker logs rag_ollama 2>&1 | grep -i "gpu\|metal\|cuda"

# 다음과 같이 표시되어야 합니다:
# "offloaded 37/37 layers to GPU"
# "device=GPU size=4.9 GiB"
```

"offloaded 0/37 layers to GPU" 또는 "device=CPU"가 표시되면 GPU가 사용되지 않는 것입니다.

## 3단계: 애플리케이션 액세스

로그에서 "All models ready!"가 표시되면 브라우저를 여세요:
```
http://localhost
```

## 시스템 사용

### 1. 문서 업로드

- PDF 파일을 업로드 영역으로 드래그앤드롭하거나 "파일 선택" 클릭
- 상태가 "처리 중"에서 "준비 완료"로 변경될 때까지 대기
- 채팅할 특정 문서를 선택하거나 모두 선택된 상태로 두기

### 2. 채팅 시작

- "채팅 시작" 버튼 클릭
- 채팅 인터페이스로 리디렉션됨
- 업로드한 문서에 대해 질문하기

### 3. 출처 보기

- 각 응답 후 오른쪽 패널에 출처가 표시됨
- 출처를 클릭하여 특정 페이지의 PDF 보기

## 문제 해결

### 모델이 다운로드되지 않음
모델이 자동으로 다운로드되지 않는 경우:
```bash
# Ollama 로그 확인
docker logs rag_ollama

# 필요한 경우 수동으로 모델 다운로드
docker exec -it rag_ollama ollama pull qwen3-embedding:0.6b
docker exec -it rag_ollama ollama pull qwen3:8b
```

### 포트가 이미 사용 중
포트 80이 이미 사용 중인 경우 `docker-compose.yml` 편집:
```yaml
frontend:
  ports:
    - "8080:80"  # 8080 또는 사용 가능한 포트로 변경
```

그런 다음 `http://localhost:8080`에서 액세스

### 모두 재시작

**기본 모드:**
```bash
docker-compose down
docker-compose up --build
```

**네이티브 Ollama 모드:**
```bash
docker-compose -f docker-compose.yml -f docker-compose.native_ollama.yml down
docker-compose -f docker-compose.yml -f docker-compose.native_ollama.yml up --build
```

모든 데이터(업로드된 PDF, 채팅 히스토리)도 지우려면:
```bash
docker-compose down -v
# 그런 다음 모드에 맞는 up 명령 사용
```

### macOS에서 오류 발생: "could not select device driver nvidia"

이는 예상된 동작입니다! macOS 사용자는 네이티브 Ollama 방법을 사용해야 합니다:
```bash
# 먼저 실행 중인 컨테이너 중지
docker-compose down

# 네이티브 Ollama 방법 사용
docker-compose -f docker-compose.yml -f docker-compose.native_ollama.yml up
```

전체 설정 지침은 1단계의 "macOS용" 섹션을 참조하세요.

### GPU가 작동하지 않음 (Linux)

Linux에서 GPU가 감지되지 않는 경우:

1. **NVIDIA 드라이버 확인:**
   ```bash
   nvidia-smi
   ```
   GPU가 표시되어야 합니다.

2. **nvidia-container-toolkit 확인:**
   ```bash
   docker run --rm --gpus all nvidia/cuda:11.0-base nvidia-smi
   ```
   컨테이너 내부에 GPU가 표시되어야 합니다.

3. **Ollama 로그 확인:**
   ```bash
   docker logs rag_ollama | grep -i gpu
   ```
   "offloaded X/Y layers to GPU"를 찾으세요. X가 Y와 같아야 합니다.

4. **nvidia-container-toolkit이 올바르게 구성되었는지 확인:**
   nvidia-container-toolkit이 설치되어 있고 설치 후 Docker 데몬이 재시작되었는지 확인하세요.

## 다음 단계

- 전체 문서는 `README.ko.md` 참조
- AI 개발 노트는 `ai_logs/README.md` 확인
- `http://localhost/docs`에서 API 탐색 (FastAPI Swagger UI)

## 개발 모드

핫 리로드로 개발 모드에서 실행:

### 백엔드
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 프론트엔드
```bash
cd frontend
npm install
npm run dev
```

그런 다음 `http://localhost:5173`에서 프론트엔드에 액세스
