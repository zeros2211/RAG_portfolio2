# RAG 채팅 시스템

한국어 | [English](README.md)

사용자가 PDF 문서를 업로드하고 지능형 대화 인터페이스를 통해 질문할 수 있는 프로덕션 레디 **RAG(Retrieval-Augmented Generation)** 채팅 시스템입니다. 최신 웹 기술로 구축되었으며 원커맨드 배포를 위해 설계되었습니다.

## 주요 기능

- **PDF 업로드 및 처리**
  - PDF 업로드를 위한 드래그앤드롭 인터페이스
  - 자동 텍스트 추출 및 처리
  - 실시간 상태 업데이트 (처리 중 → 준비 완료 → 실패)
  - 여러 문서 동시 업로드 지원

- **지능형 검색**
  - 벡터 임베딩을 사용한 의미론적 검색
  - 영구 저장소를 갖춘 ChromaDB 벡터 데이터베이스
  - 페이지 인식 청킹 (페이지 간 청크 없음)
  - 페이지 번호가 포함된 출처 표시

- **대화형 채팅**
  - Server-Sent Events(SSE)를 통한 스트리밍 응답
  - 컨텍스트가 있는 다중 턴 대화 지원
  - 문서 필터링 (특정 문서 또는 모든 문서 검색)
  - 실시간 타이핑 인디케이터

- **출처 인용**
  - 관련도 점수가 있는 클릭 가능한 출처
  - 특정 페이지의 PDF 뷰어로 직접 이동
  - 관련 섹션의 텍스트 스니펫
  - 시각적 관련도 표시기

- **PDF 뷰어**
  - react-pdf가 내장된 PDF 뷰어
  - 페이지 탐색 (이전/다음/페이지 이동)
  - 채팅 출처에서 직접 링크
  - 반응형 디자인

- **원커맨드 배포**
  - `docker-compose up`으로 전체 시스템 실행
  - 수동 구성 불필요
  - 영구 데이터 저장소
  - 프로덕션 레디 설정

## 기술 스택

### 백엔드
- **Python 3.9+** - 핵심 언어
- **FastAPI** - 최신 비동기 웹 프레임워크
- **PyMuPDF (fitz)** - PDF 텍스트 추출
- **ChromaDB** - 임베딩용 벡터 데이터베이스
- **SQLite + SQLModel** - 세션 및 대화 저장소
- **Ollama** - 로컬 LLM 및 임베딩

### 프론트엔드
- **React 18** - UI 프레임워크
- **TypeScript** - 타입 안정성
- **Vite** - 빌드 도구 및 개발 서버
- **shadcn/ui** - 컴포넌트 라이브러리
- **TailwindCSS** - 스타일링
- **react-pdf** - PDF 뷰어 컴포넌트
- **Axios** - HTTP 클라이언트

### 인프라
- **Docker + Docker Compose** - 컨테이너화
- **Nginx** - 프론트엔드 서버 및 API 프록시
- **Ollama** - LLM 추론 서버

## GPU 지원

이 시스템은 플랫폼별 GPU 가속을 지원합니다:

### NVIDIA GPU가 있는 Linux용 (기본)
NVIDIA GPU와 드라이버 및 `nvidia-container-toolkit` 설치가 필요합니다.

```bash
docker-compose up
```

### macOS용 (네이티브 Ollama를 통한 Metal GPU)
**⚠️ 중요**: macOS 사용자는 반드시 이 방법을 사용해야 합니다. 기본 `docker-compose up` 명령은 NVIDIA 드라이버 설정으로 인해 macOS에서 실패합니다.

```bash
# 1. Ollama 네이티브 설치
brew install ollama

# 2. Ollama 시작 및 모델 다운로드
ollama serve &
ollama pull qwen3-embedding:0.6b
ollama pull qwen3:8b

# 3. 백엔드와 프론트엔드 시작 (Docker Ollama 제외)
docker-compose -f docker-compose.yml -f docker-compose.native_ollama.yml up
```

### 기타 시스템용 (CPU 모드)
Windows 또는 NVIDIA GPU가 없는 Linux를 사용하는 경우 CPU 모드가 필요합니다. CPU 전용 docker-compose 구성은 관리자에게 문의하세요.

**성능 비교:**
- CPU 모드: ~10-20 토큰/초
- **GPU (NVIDIA가 있는 Linux)**: ~50-100+ 토큰/초 ⚡ (기본)
- **Metal (macOS 네이티브)**: ~80-150+ 토큰/초 ⚡ (Mac에서 최고)

## 빠른 시작

자세한 설정 지침은 [빠른 시작 가이드](QUICKSTART.ko.md)를 참조하세요.

### 요약

**NVIDIA GPU가 있는 Linux:**
```bash
# 1. 서비스 시작
docker-compose up --build

# 2. GPU 가속으로 모델이 자동 다운로드됨
#    "All models ready!" 대기

# 3. 브라우저 열기
open http://localhost
```

**네이티브 Ollama가 있는 macOS (Metal GPU):**
```bash
# 1. 네이티브 Ollama 설치 및 시작
brew install ollama
ollama serve &
ollama pull qwen3-embedding:0.6b
ollama pull qwen3:8b

# 2. 백엔드와 프론트엔드 시작
docker-compose -f docker-compose.yml -f docker-compose.native_ollama.yml up --build

# 3. 브라우저 열기
open http://localhost
```

## 아키텍처

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│   Frontend  │───▶│   Nginx      │───▶│   Backend   │
│ React+Vite  │◀───│ (SSE proxy)  │◀───│   FastAPI   │
└─────────────┘    └──────────────┘    └─────────────┘
                                              │
                   ┌──────────────────────────┼────────────┐
                   │                          │            │
                   ▼                          ▼            ▼
            ┌──────────┐              ┌──────────┐  ┌──────────┐
            │  Ollama  │              │ ChromaDB │  │  SQLite  │
            │ qwen3:8b │              │ (vectors)│  │(sessions)│
            └──────────┘              └──────────┘  └──────────┘
```

### 데이터 흐름

1. **업로드**: PDF → PyMuPDF → 텍스트 추출 → 정규화 → 청킹
2. **인덱싱**: 청크 → Ollama 임베딩 → ChromaDB 저장
3. **쿼리**: 사용자 질문 → 임베딩 → 의미론적 검색 → 컨텍스트 구축
4. **응답**: 컨텍스트 + 히스토리 → LLM → SSE 스트리밍 → 프론트엔드
5. **인용**: 출처 클릭 → PDF 뷰어 (특정 페이지)

## 왜 Ollama인가?

### 이점
- **로컬 배포**: 외부 API 키나 네트워크 종속성 없음
- **프라이버시**: 모든 데이터가 인프라에 유지됨
- **비용**: 토큰당 요금 없음
- **제어**: 모델 선택 및 매개변수에 대한 완전한 제어
- **속도**: 네트워크 지연 없이 직접 액세스

### 모델 선택

**qwen3-embedding:0.6b** (임베딩 모델)
- 작은 풋프린트 (~400MB)
- 빠른 추론
- 의미론적 검색을 위한 좋은 품질의 임베딩
- 검색 작업에 최적화됨

**qwen3:8b** (LLM 모델)
- 균형 잡힌 성능/품질 (~5GB)
- 강력한 추론 능력
- 우수한 다국어 지원
- 대화형 AI에 효율적

`.env` 구성을 변경하여 대체 모델로 쉽게 교체할 수 있습니다.

## 프로젝트 구조

```
RAG_portfolio/
├── backend/
│   ├── app/
│   │   ├── routers/         # API 엔드포인트
│   │   │   ├── documents.py # 업로드 및 문서 관리
│   │   │   └── chat.py      # SSE 스트리밍 채팅
│   │   ├── services/        # 비즈니스 로직
│   │   │   ├── pdf_service.py
│   │   │   └── ollama_service.py
│   │   ├── db/              # 데이터베이스 클라이언트
│   │   │   ├── chroma_client.py
│   │   │   └── sqlite_client.py
│   │   ├── models/          # 데이터 모델
│   │   ├── utils/           # 유틸리티
│   │   │   ├── text_normalizer.py
│   │   │   └── chunker.py
│   │   ├── config.py        # 구성
│   │   └── main.py          # FastAPI 앱
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/          # shadcn/ui 컴포넌트
│   │   │   ├── upload/      # 업로드 인터페이스
│   │   │   ├── chat/        # 채팅 인터페이스
│   │   │   └── viewer/      # PDF 뷰어
│   │   ├── pages/           # 페이지 컴포넌트
│   │   ├── hooks/           # 커스텀 훅 (useSSE)
│   │   ├── services/        # API 클라이언트
│   │   └── types/           # TypeScript 타입
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── data/                    # 영구 데이터 (gitignored)
│   ├── pdfs/               # 업로드된 PDF
│   ├── chroma/             # 벡터 데이터베이스
│   └── sessions.db         # 채팅 세션
├── docker-compose.yml
├── QUICKSTART.md
└── README.md
```

## API 엔드포인트

### 문서

- `POST /api/documents` - PDF 파일 업로드
- `GET /api/documents` - 모든 문서 목록
- `GET /api/documents/{doc_id}` - 문서 세부정보 가져오기
- `GET /api/documents/{doc_id}/file` - PDF 다운로드

### 채팅

- `POST /api/chat/stream` - 스트리밍 채팅 엔드포인트 (SSE)
  - 쿼리 매개변수: `message`, `session_id`, `doc_ids`
  - 이벤트: `session`, `token`, `sources`, `done`, `error`

### 상태 확인

- `GET /health` - 상태 확인
- `GET /` - API 정보

## 구성

`backend/.env`를 편집하여 사용자 정의:

```env
# Ollama
OLLAMA_URL=http://ollama:11434
EMBEDDING_MODEL=qwen3-embedding:0.6b
LLM_MODEL=qwen3:8b

# RAG 매개변수
CHUNK_SIZE=1000           # 청크당 문자 수
CHUNK_OVERLAP=150         # 청크 간 중복
TOP_K=5                   # 검색할 결과 수
MAX_CONTEXT_TURNS=5       # 대화 히스토리 턴 수
```

## 성능 최적화

### 현재 최적화
- **비동기 처리**: PDF 처리를 위한 백그라운드 작업
- **문장 인식 청킹**: 더 나은 컨텍스트 보존
- **영구 ChromaDB**: 재시작 시 재인덱싱 방지
- **SSE 스트리밍**: 즉각적인 응답 피드백
- **페이지 인식 청킹**: 정확한 출처 표시

### 향후 개선 사항
1. **배치 임베딩**: 여러 청크를 병렬로 처리
2. **캐싱**: 빈번한 쿼리 및 임베딩 캐시
3. **하이브리드 검색**: 밀집 + 희소 검색 결합
4. **모델 양자화**: 양자화된 모델로 더 빠른 추론
5. **비동기 큐**: 무거운 처리를 위한 작업 큐
6. **멀티 GPU 지원**: LLM 추론 분산

## 개발

### 백엔드 개발

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows에서는 `venv\Scripts\activate`
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

`http://localhost:8000/docs`에서 API 문서에 액세스

### 프론트엔드 개발

```bash
cd frontend
npm install
npm run dev
```

`http://localhost:5173`에서 프론트엔드에 액세스

### 환경 설정

1. 백엔드 디렉토리에서 `.env.example`을 `.env`로 복사
2. 필요에 따라 설정 조정
3. Ollama가 실행 중이고 모델이 다운로드되었는지 확인

## 문제 해결

### Ollama 연결 실패
```bash
# Ollama 컨테이너가 실행 중인지 확인
docker ps | grep ollama

# Ollama 로그 확인
docker logs rag_ollama

# 모델 확인
docker exec -it rag_ollama ollama list
```

### 백엔드 오류
```bash
# 백엔드 로그 보기
docker logs rag_backend

# 데이터베이스 파일 확인
ls -lh data/
```

### 프론트엔드 로드 안됨
```bash
# nginx 로그 확인
docker logs rag_frontend

# 프론트엔드 재빌드
docker-compose up --build frontend
```

### SSE 스트리밍 문제
- nginx 구성에 `proxy_buffering off`가 있는지 확인
- EventSource 오류에 대한 브라우저 콘솔 확인
- 백엔드의 CORS 설정 확인

### GPU 감지 안됨 (Linux)
```bash
# NVIDIA 드라이버 확인
nvidia-smi

# Docker가 GPU에 액세스할 수 있는지 확인
docker run --rm --gpus all nvidia/cuda:11.0-base nvidia-smi

# Ollama가 GPU를 사용하는지 확인
docker logs rag_ollama | grep -i "offloaded.*gpu"
# 다음과 같이 표시되어야 함: "offloaded 37/37 layers to GPU"

# GPU compose 파일을 사용하는지 확인
docker-compose -f docker-compose.yml -f docker-compose.nvidia.yml up
```

## 보안 고려사항

- **프로덕션 배포**:
  - CORS 설정을 `allow_origins=["*"]`에서 변경
  - 민감한 구성에 환경 변수 사용
  - 인증/권한 부여 추가
  - SSL 인증서로 HTTPS 활성화
  - API 엔드포인트에 대한 속도 제한

- **데이터 프라이버시**:
  - 모든 처리가 로컬에서 발생
  - 외부 서비스로 데이터 전송 없음
  - 업로드된 PDF가 로컬 파일시스템에 저장됨

## 라이선스

이 프로젝트는 오픈 소스이며 MIT 라이선스에 따라 제공됩니다.

## 기여

기여를 환영합니다! 다음을 수행하세요:
1. 저장소 포크
2. 기능 브랜치 생성
3. 변경 사항 적용
4. 풀 리퀘스트 제출

## 감사의 말

- [FastAPI](https://fastapi.tiangolo.com/)로 구축
- [shadcn/ui](https://ui.shadcn.com/)의 UI 컴포넌트
- [PyMuPDF](https://pymupdf.readthedocs.io/)로 PDF 처리
- [ChromaDB](https://www.trychroma.com/)로 벡터 검색
- [Ollama](https://ollama.ai/)를 통한 LLM 추론

## 지원

문제 및 질문:
- GitHub에서 이슈 열기
- 솔루션에 대한 기존 이슈 확인
- 오류 메시지에 대한 로그 검토

---

**Claude Code로 구축** - 최신 풀스택 개발 관행을 보여주는 프로덕션 레디 RAG 시스템.
