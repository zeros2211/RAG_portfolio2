# RAG 채팅 시스템

한국어 | [English](README.en.md)

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

여러 LLM 서빙 프레임워크를 평가한 후, 이 프로젝트에는 **Ollama**를 선택했습니다.

**핵심 이점:**
- **로컬 배포**: 외부 API 키나 네트워크 종속성 없음
- **프라이버시**: 모든 데이터가 인프라에 유지됨
- **비용**: 토큰당 요금 없음
- **속도**: 네트워크 지연 없이 직접 액세스

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
- **고급 최적화**: ⚠️ 이 규모에는 불필요 (5-10명 동시 사용자)

#### 트레이드오프

**얻은 것:**
- 빠른 배포 및 반복
- 간단한 디버깅 및 모니터링
- 쉬운 모델 실험
- 좋은 개발자 경험

**희생한 것:**
- vLLM의 continuous batching 및 PagedAttention (KV 캐시 메모리 최적화)
- 추론 파라미터에 대한 세밀한 제어
- 최대 이론적 처리량

**왜 가치가 있는가:**
5-10명의 동시 사용자가 예상되는 RAG 시스템의 경우, 배포 단순성과 개발 속도가 원시 성능보다 중요합니다. 100명 이상의 동시 사용자로 확장할 경우, vLLM으로 마이그레이션하는 것이 다음 단계가 될 것입니다.

#### 프로덕션 고려사항

**언제 전환해야 하는가:**
- **사용자 부하**: >50명 동시 사용자 → vLLM 고려
- **응답 시간**: 현재 2-3초는 허용 가능; <1초 필요 시 → vLLM의 최적화된 추론
- **비용 최적화**: 높은 GPU 사용률 필요 → vLLM의 더 나은 배칭

**마이그레이션 경로:**
Ollama의 무상태 API 설계로 마이그레이션이 간단합니다 - `ollama_service.py`만 업데이트하면 비즈니스 로직은 그대로 유지됩니다.

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
