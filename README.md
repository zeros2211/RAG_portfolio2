# RAG 채팅 시스템
<img width="2560" height="1289" alt="스크린샷 2026-02-16 오후 8 48 12" src="https://github.com/user-attachments/assets/f9a771c8-1462-43a2-b14d-9fc14ddf56f3" />

사용자가 PDF 문서를 업로드하고 지능형 대화 인터페이스를 통해 질문할 수 있는 **RAG(Retrieval-Augmented Generation)** 채팅 시스템입니다. 최신 웹 기술로 구축되었으며 원커맨드 배포를 위해 설계되었습니다.

## 빠른 시작

자세한 설정 지침은 [빠른 시작 가이드](QUICKSTART.md)를 참조하세요.

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

**성능 비교** (하드웨어에 따라 차이가 있음):
- CPU 모드: ~10-30 토큰/초
- **GPU (NVIDIA가 있는 Linux)**: ~50-150+ 토큰/초 ⚡ (기본)
- **Metal (macOS 네이티브)**: ~30-80+ 토큰/초 ⚡ (Mac에서 권장)

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

## LLM 서빙 프레임워크 선택

### Ollama를 선택한 이유

로컬 LLM 서빙이라는 전제 하에 실질적인 비교 대상은 **vLLM**과 **Ollama** 두 가지였습니다. vLLM은 PagedAttention 기반의 높은 처리량과 연속 배칭(continuous batching)이 강점이지만, 이는 수십~수백 명의 동시 요청을 처리하는 프로덕션 환경에서 의미 있는 이점입니다. 이 프로젝트는 포트폴리오 시연 목적이고, 로컬 머신(또는 단일 Docker 호스트)에서 LLM을 구동하는 만큼 하드웨어 자체가 대규모 동시 요청 처리에 적합하지 않으므로, vLLM의 처리량 최적화가 가져다주는 실질적 이득이 크지 않았습니다. 오히려 vLLM은 GPU를 필수로 요구하고, 양자화 모델 지원이 제한적이며, Docker 기반 배포 시 설정이 복잡해지는 단점이 있었습니다. Ollama는 `docker-compose up` 한 줄로 모델 다운로드부터 서비스 시작까지 완료되고, GPU가 없으면 자동으로 CPU 추론으로 폴백하며, 임베딩과 채팅 생성을 하나의 서비스에서 모두 제공합니다. 즉, 이 프로젝트의 성격과 배포 조건에서는 vLLM의 성능 이점보다 Ollama의 운영 단순성이 더 큰 가치를 가진다고 판단했습니다.

### 모델 선택

| 모델 | 용도 | 크기 | 특징 |
|------|------|------|------|
| **qwen3-embedding:0.6b** | 임베딩 | ~400MB | 검색 작업에 최적화, 빠른 추론 |
| **qwen3:8b** | LLM | ~5GB | 균형 잡힌 성능/품질, 우수한 다국어 지원 |

`.env` 구성을 변경하여 대체 모델로 쉽게 교체할 수 있습니다.

상세한 비교 및 근거는 다음과 같습니다:

#### 프레임워크 비교

| 프레임워크 | 장점 | 단점 | 사용 사례 |
|-----------|------|------|----------|
| **Ollama** | - 간단한 API<br>- 내장 모델 관리<br>- Docker 친화적<br>- 좋은 문서화 | - 제한적인 최적화 옵션<br>- 추론에 대한 제어 부족 | 중소규모 배포, 빠른 프로토타이핑 |
| **vLLM** | - 뛰어난 처리량<br>- PagedAttention 최적화<br>- 배치 처리 | - 복잡한 설정<br>- 높은 리소스 요구사항<br>- GPU 중심 | 고처리량 프로덕션 시스템 |
| **Text Generation Inference (TGI)** | - 프로덕션 준비<br>- 고급 기능<br>- HuggingFace 통합 | - 가파른 학습 곡선<br>- 무거움 | 엔터프라이즈 배포 |
| **LocalAI** | - OpenAI 호환 API<br>- 멀티모달 지원 | - 덜 성숙함<br>- 커뮤니티 주도 | API 호환성 필요 |

#### 의사결정 근거

**1. 배포 단순성** (높은 우선순위)
- **요구사항**: 원커맨드 배포 (`docker-compose up`)
- **Ollama 장점**: 사전 빌드된 Docker 이미지, 자동 모델 풀링, 제로 설정
- **효과**: 모델 다운로드 + 환경 구성 + 서비스 시작까지 단일 명령어로 완료

**2. 개발 속도** (높은 우선순위)
- **Ollama의 간단한 API**: 직접적인 HTTP 호출, 복잡한 클라이언트 설정 불필요
- **모델 관리**: `ollama pull` vs 수동 모델 다운로드 + 구성
- **반복 속도**: 실험을 위한 빠른 모델 전환

**3. 리소스 효율성** (중간 우선순위)
- **메모리 풋프린트**: Ollama의 효율적인 모델 로딩 (요청 간 공유)
- **CPU 폴백**: GPU 사용 불가능 시 자동으로 CPU 추론으로 전환
- **비교** (qwen3:8b 기준):
  - Ollama: ~6GB (GPU VRAM 또는 시스템 RAM, 환경에 따라 자동 선택)
  - vLLM: FP16 시 ~16GB GPU VRAM, 양자화 시 ~5-8GB GPU VRAM (GPU 필수)
  - TGI: FP16 시 ~16GB GPU VRAM (GPU 필수)

**4. 기능 요구사항**
- **스트리밍**: ✅ Ollama가 NDJSON 스트리밍을 네이티브로 지원 (백엔드에서 SSE로 변환)
- **임베딩**: ✅ 내장 임베딩 엔드포인트
- **대화 컨텍스트**: ✅ 무상태 설계가 RAG 패턴에 적합

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

- `GET /api/chat/stream` - 스트리밍 채팅 엔드포인트 (SSE)
- `GET /api/chat/sessions` - 모든 채팅 세션 목록
- `GET /api/chat/sessions/{session_id}` - 특정 세션 조회
- `DELETE /api/chat/sessions/{session_id}` - 세션 삭제
- `PUT /api/chat/sessions/{session_id}/title` - 세션 제목 수정
- `GET /api/chat/sessions/{session_id}/messages` - 세션 메시지 조회

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

## 설계 가정과 한계

이 시스템은 특정 사용 환경을 전제로 설계되었습니다. 아래에서는 그 가정이 무엇이고, 왜 그 가정을 세웠으며, 현재 구현이 왜 그 가정 하에서 적절한 선택인지, 그리고 가정이 달라지면 어디를 어떻게 바꿔야 하는지를 설명합니다.

### 가정 1: PDF 파일 용량은 개당 50MB 이하

**왜 이 가정을 세웠는가:**
이 프로젝트는 포트폴리오 시연 목적이며, 리뷰어가 기술 문서·논문·이력서 등을 올려 테스트하는 시나리오를 상정했습니다. 이런 문서는 대부분 수십 페이지, 수 MB 수준입니다. 수백 페이지의 대형 보고서를 업로드하더라도 50MB를 넘는 경우는 드뭅니다.

**현재 구현이 이 가정에서 적절한 이유:**
- **Nginx**: `client_max_body_size 50m`으로 업로드 상한을 명시적으로 제한합니다. 이 크기를 넘는 요청은 413 에러로 즉시 거부되어, 서버 리소스를 보호합니다.
- **업로드 핸들러**: 파일 전체를 메모리에 올리지 않고 1MB 단위로 스트리밍하여 디스크에 저장합니다. 50MB 파일이 올라와도 메모리 사용량은 1MB 수준으로 일정합니다.
- **PyMuPDF 텍스트 추출**: 50MB 이하의 PDF(일반적으로 500페이지 이내)에서 `fitz.open()` → 페이지별 텍스트 추출은 메모리와 처리 시간 모두 합리적인 범위 안에 있습니다.
- **임베딩 생성**: 500페이지 PDF에서 약 1,000~1,500개 청크가 생성되고, 청크당 순차적으로 Ollama에 임베딩을 요청합니다. GPU 환경에서 청크당 20~50ms이므로, 최대 약 75초 이내에 완료됩니다. CPU 환경에서는 100~300ms로 최대 약 7분이지만, BackgroundTask로 처리되므로 사용자가 응답을 기다리는 것은 아닙니다.

**가정이 달라지면 (100MB+ PDF):**
- Nginx `client_max_body_size` 상향이 필요합니다.
- PyMuPDF가 전체 페이지 텍스트를 메모리에 축적하므로, 페이지 단위로 추출 → 청킹 → 임베딩을 스트리밍 파이프라인으로 전환해야 합니다.
- 임베딩 순차 처리의 총 소요 시간이 수십 분으로 늘어나므로, Ollama 배치 임베딩 API 활용이나 비동기 병렬 요청이 필요합니다.
- ChromaDB에 수천 건을 단일 `add()` 호출로 삽입하면 메모리 문제가 생길 수 있으므로, 배치 단위 분할 삽입이 필요합니다.

### 가정 2: 동시 업로드 파일 수는 소량

**왜 이 가정을 세웠는가:**
포트폴리오 시연에서 리뷰어가 한 번에 수십 개의 파일을 업로드할 이유가 없습니다. 일반적으로 1~3개의 문서를 올려서 시스템 동작을 확인하는 것이 자연스러운 사용 패턴입니다. 또한 로컬 단일 호스트에서 LLM을 구동하는 만큼, 하드웨어 자체가 대량 동시 처리에 적합하지 않습니다.

**현재 구현이 이 가정에서 적절한 이유:**
- **파일 수 제한 없음**: 코드에서 업로드 파일 수를 인위적으로 제한하지 않습니다. 단, Nginx의 `client_max_body_size 50m`이 모든 파일의 합산 크기에 적용되므로, 이것이 자연스러운 상한 역할을 합니다.
- **BackgroundTasks**: 업로드 요청은 즉시 응답하고, PDF 처리(텍스트 추출 → 청킹 → 임베딩 → 저장)는 백그라운드에서 순차 실행됩니다. 소량 파일에서는 이 순차 처리가 충분히 빠르게 완료되고, 별도 인프라(Redis, Celery 등) 없이 단일 프로세스로 동작해 배포가 단순합니다.
- **In-memory 문서 레지스트리**: 문서 메타데이터를 dict에 저장합니다. 수십 개 수준에서 메타데이터는 가볍기 때문에 문제가 없습니다.

**가정이 달라지면 (대량 동시 업로드):**
- 수십 개 이상의 파일이 동시에 업로드되면 BackgroundTasks의 순차 처리로 인해 뒤에 올라온 파일이 오랫동안 PROCESSING 상태로 남게 됩니다. Celery/RQ 같은 작업 큐로 전환하여 병렬 처리가 필요합니다.
- 누적 문서 수가 수백 건을 넘으면 ChromaDB의 HNSW 인덱스 크기가 커져 검색 성능이 저하됩니다. 문서별 컬렉션 분리나 인덱스 최적화가 필요합니다.
- In-memory 레지스트리는 프로세스 재시작 시 유실되므로, SQLite 등 영속 저장소로 이전해야 합니다.

### 가정 3: 네트워크는 일반적인 가정/사무실 환경

**왜 이 가정을 세웠는가:**
로컬 서빙 프로젝트이므로, 파일 업로드는 사용자의 브라우저 → 같은 네트워크의 Docker 호스트(또는 localhost)로 전송됩니다. 일반적인 가정/사무실 네트워크(10Mbps 이상)에서 수 MB~수십 MB 파일의 전송은 수 초 내에 완료됩니다. 처리 파이프라인(임베딩, LLM 생성)은 Docker 컨테이너 간 통신이므로 외부 네트워크 속도와 무관합니다.

**현재 구현이 이 가정에서 적절한 이유:**
- **Nginx**: `proxy_read_timeout 86400s`(24시간)로 설정되어 있어, 느린 업로드라도 타임아웃으로 끊기지 않습니다.
- **컨테이너 간 통신**: 임베딩 요청(백엔드 → Ollama)은 Docker 내부 네트워크를 사용하므로, 사실상 네트워크 지연이 없고 Ollama의 추론 속도만이 병목입니다. httpx timeout은 임베딩 60초, LLM 생성 120초로 설정되어 있어 정상적인 추론 시간에는 충분합니다.
- **SSE 스트리밍**: LLM 응답을 토큰 단위로 스트리밍하므로, 전체 응답을 기다릴 필요 없이 첫 토큰부터 바로 표시됩니다. 저대역폭에서도 UX 영향이 적습니다.

**가정이 달라지면 (원격 서버 배포 또는 저대역폭 환경):**
- 원격 서버에 배포하면 업로드 시간이 네트워크 속도에 비례하여 증가합니다. 업로드 진행률 표시와 재시도 로직(resumable upload)이 필요합니다.
- 해외 서버 등 높은 지연 환경에서는 SSE 연결 유지가 불안정할 수 있으므로, WebSocket 전환이나 연결 재시도 로직 강화가 필요합니다.
- `client_max_body_size`와 별도로 청크 업로드(클라이언트에서 파일을 분할하여 전송 후 서버에서 조립)를 구현하면 대용량 파일의 안정적 업로드가 가능합니다.

## 성능 개선 방안

### 1. 임베딩 생성 병렬화
**현재 상태:** 청크별로 순차적으로 임베딩을 생성 (각 ~100ms)

**제안:** Ollama의 배치 API를 활용하여 여러 청크를 한 번에 임베딩

**예상 효과:**
- 처리 시간: 1000ms (10개 청크) → 150ms (85% 감소)
- PDF 인덱싱: 30초 (100페이지) → 7초

**구현하지 않은 이유:**
- Ollama의 배치 API는 문서화가 제한적
- 대용량 배치에서 메모리 문제 위험
- 현재 부하에서 수익 감소 (1-2개 동시 업로드)

### 2. 쿼리 임베딩 캐싱
**현재 상태:** 동일한 쿼리라도 매번 임베딩을 재계산 (~100ms)

**제안:** 쿼리 문자열을 키로 하는 인메모리 캐시를 두어 동일 쿼리의 임베딩을 재사용

**예상 효과:**
- 캐시 적중률: ~40% (일반적인 사용에서 추정)
- 평균 응답 시간: 3.5초 → 2.8초 (20% 개선)
- 비용: 1000개의 캐시된 쿼리에 ~50MB RAM

**구현하지 않은 이유:**
- 모델 변경 시 캐시 무효화 처리 필요
- 세션별 쿼리로 적중률 감소
- **우선순위:** 중간 (더 나은 UX를 위한 선호 사항)

### 3. 하이브리드 검색 (밀집 + 희소)
**현재 상태:** 순수 의미론적 검색 (cosine 유사도)만 사용하여 정확한 키워드 일치를 놓칠 수 있음

**제안:** 밀집 임베딩(ChromaDB) + 희소 검색(BM25)을 병행하고, 상호 순위 융합(RRF)으로 결과를 병합

**예상 효과:**
- 검색 정확도: +10-15% (특히 기술 용어, 이름의 경우)
- 예: "API 엔드포인트" 쿼리가 "REST API" 섹션과 더 잘 매칭
- 지연시간: +30ms (BM25는 빠름)

**구현하지 않은 이유:**
- 추가 종속성 (rank-bm25)
- 결과 병합의 복잡도 증가
- 별도의 BM25 인덱스 유지 필요
- **이익/비용 비율:** 보통 (좋은 개선이지만 복잡함)

### 4. 모델 양자화
**현재:** Q4_K_M 양자화 모델 (Ollama 기본 제공, qwen3:8b에 ~5GB)
**제안:** 더 높은 정밀도의 양자화 (Q8_0) 또는 FP16 모델 사용

**예상 효과:**
- Q8_0: 품질 +2-3%, 모델 크기 ~8.5GB, 추론 속도 -10-20%
- FP16: 최대 품질, 모델 크기 ~16GB, 추론 속도 -30-50%
- 복잡한 추론 및 다국어 처리에서 정확도 향상

**구현하지 않은 이유:**
- 현재 Q4_K_M이 대부분의 RAG 쿼리에 충분한 품질 제공
- 더 높은 정밀도는 메모리 요구사항 대폭 증가
- GPU VRAM 제한 환경에서 실행 불가능할 수 있음
- **우선순위:** 낮음 (POC에는 현재 품질이 허용 가능)

### 5. PDF 처리를 위한 작업 큐
**현재 상태:** FastAPI의 `BackgroundTasks`로 백그라운드 처리하지만, 동일 프로세스 내에서 실행되므로 CPU 집약적 작업(텍스트 추출, 임베딩 생성)이 이벤트 루프에 간접적 영향을 줄 수 있음

**제안:** Celery/RQ 등 별도 워커 프로세스로 PDF 처리를 분리하여 완전한 격리 달성

**예상 효과:**
- 백엔드 응답성: CPU 집약적 작업의 완전한 격리
- 확장성: 100개 이상의 문서 대기열 가능
- 모니터링: 더 나은 작업 상태 추적

**구현하지 않은 이유:**
- 인프라 복잡성 증가 (Redis/RabbitMQ)
- 현재 부하에 과도함 (<10개 동시 업로드)
- 현재 `BackgroundTasks` 접근 방식으로 충분
- **필요 시점:** >50개 동시 업로드 또는 >100MB PDF 파일

### 6. 모니터링 및 관찰 가능성
**현재 상태:** 기본 로깅만 구현

**제안:** 각 구성요소(임베딩, 검색, LLM)에 타이머를 추가하여 P50/P95/P99 지연시간, 오류율, 리소스 사용률을 추적 (Prometheus + Grafana 등)

**예상 효과:**
- 병목 지점의 정량적 파악
- 이상 탐지 및 알림
- 데이터 기반 성능 최적화 가능

**구현하지 않은 이유:**
- 관찰 가능성 스택 추가로 인프라 복잡성 증가
- 면접 범위에서는 핵심 기능에 집중

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
