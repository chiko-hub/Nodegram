# Nodegram - Express 기반 SNS 서버

## 프로젝트 개요

Nodegram은 Express.js를 기반으로 구축된 SNS 서비스의 백엔드 서버입니다. 사용자 인증, 피드 관리, 파일 업로드 등의 기능을 제공합니다.

## 주요 기능

**인증 및 보안**
- Passport.js를 활용한 카카오 소셜 로그인
- 세션 기반 사용자 인증
- bcrypt를 이용한 비밀번호 암호화

**미들웨어**
- Cookie Parser를 통한 쿠키 관리
- Express Session을 이용한 세션 관리
- Multer를 활용한 파일 업로드 처리

**데이터베이스**
- MySQL2를 이용한 데이터베이스 연동
- 사용자 정보 및 피드 데이터 관리

## 기술 스택

| 분류 | 기술 |
|------|------|
| 런타임 | Node.js |
| 프레임워크 | Express.js 4.21.2 |
| 데이터베이스 | MySQL2 3.12.0 |
| 인증 | Passport.js 0.7.0, passport-kakao 1.0.1 |
| 파일 처리 | Multer 1.4.5 |
| 보안 | bcrypt 5.1.1 |

## 설치 방법

```bash
# 저장소 클론
git clone [repository-url]

# 의존성 설치
npm install

# 환경변수 설정
cp .env.example .env
# .env 파일을 편집하여 필요한 환경변수 설정

# 서버 실행
npm start
```

## 환경변수 설정

```plaintext
PORT=3000
COOKIE_SECRET=[쿠키 암호화 키]
DB_HOST=[데이터베이스 호스트]
DB_USER=[데이터베이스 사용자]
DB_PASSWORD=[데이터베이스 비밀번호]
DB_NAME=[데이터베이스 이름]
KAKAO_CLIENT_ID=[카카오 클라이언트 ID]
KAKAO_CALLBACK_URL=[카카오 콜백 URL]
```

## 프로젝트 구조

```plaintext
/
├── App.js              # 애플리케이션 진입점
├── package.json        # 프로젝트 설정 및 의존성
├── Routers/           # 라우터 디렉토리
│   ├── index.js       # 메인 라우터
│   ├── user.js        # 사용자 관련 라우터
│   └── feed.js        # 피드 관련 라우터
├── passport/          # Passport 설정
├── public/           # 정적 파일
└── views/            # 뷰 템플릿
```

## API 엔드포인트

- `/`: 메인 페이지
- `/user`: 사용자 관련 API
- `/feed`: 피드 관련 API

## 개발자 참고사항

- nodemon을 통한 개발 서버 자동 재시작 지원
- 404 에러 핸들링 미들웨어 구현
- 정적 파일 서빙을 위한 public 디렉토리 설정

## 라이선스

 MIT License
