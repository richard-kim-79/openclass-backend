import multer from 'multer';
import path from 'path';
import fs from 'fs';

// 업로드 디렉토리 생성
const uploadDir = process.env.UPLOAD_PATH || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 파일 저장 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // 원본 파일명에 타임스탬프 추가하여 중복 방지
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// 파일 필터링
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = process.env.ALLOWED_FILE_TYPES?.split(',') || [
    'pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt', 
    'jpg', 'jpeg', 'png', 'gif', 'mp4', 'avi', 'mov'
  ];
  
  const fileExtension = path.extname(file.originalname).toLowerCase().substring(1);
  
  if (allowedTypes.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error(`지원하지 않는 파일 형식입니다: ${fileExtension}`));
  }
};

// 파일 크기 제한
const maxFileSize = parseInt(process.env.MAX_FILE_SIZE || '10485760'); // 10MB

// Multer 설정
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: maxFileSize,
    files: 5 // 최대 5개 파일
  }
});

// 단일 파일 업로드
export const uploadSingle = upload.single('file');

// 다중 파일 업로드
export const uploadMultiple = upload.array('files', 5);

// 에러 핸들링 미들웨어
export const handleUploadError = (err: any, req: any, res: any, next: any) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: '파일 크기가 너무 큽니다. (최대 10MB)'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: '파일 개수가 너무 많습니다. (최대 5개)'
      });
    }
    return res.status(400).json({
      success: false,
      error: '파일 업로드 중 오류가 발생했습니다.'
    });
  }
  
  if (err.message.includes('지원하지 않는 파일 형식')) {
    return res.status(400).json({
      success: false,
      error: err.message
    });
  }
  
  next(err);
}; 