import { Request, Response, NextFunction } from 'express';

/**
 * 통합 검색
 */
export const searchAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q, type, limit = 10, page = 1 } = req.query;
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        success: false,
        error: '검색어를 입력해주세요.'
      });
    }
    
    // 실제로는 검색 서비스 호출
    // const results = await searchContent({
    //   query: q,
    //   type: type as string || 'all',
    //   limit: parseInt(limit as string) || 10,
    //   page: parseInt(page as string) || 1
    // });

    // 임시 검색 결과
    const results = [
      {
        type: 'classroom',
        id: '1',
        title: 'JavaScript 기초 강의',
        description: 'JavaScript 프로그래밍 기초를 배우는 강의입니다.',
        instructor: '김강사',
        created_at: new Date().toISOString()
      },
      {
        type: 'material',
        id: '1',
        title: 'JavaScript 강의 자료',
        description: 'JavaScript 기초 강의 자료입니다.',
        classroom: 'JavaScript 기초 강의',
        author: '김강사',
        created_at: new Date().toISOString()
      },
      {
        type: 'thread',
        id: '1',
        title: 'JavaScript 질문',
        description: 'JavaScript에 대한 질문이 있습니다.',
        classroom: 'JavaScript 기초 강의',
        author: '학생1',
        created_at: new Date().toISOString()
      }
    ];
    
    return res.json({
      success: true,
      data: {
        results,
        total: results.length,
        query: q,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: results.length,
          totalPages: Math.ceil(results.length / Number(limit))
        }
      }
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * 강의실 검색
 */
export const searchClassrooms = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q, category, instructor, isPublic, limit = 20, page = 1 } = req.query;
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        success: false,
        error: '검색어를 입력해주세요.'
      });
    }

    // 실제로는 DB에서 강의실 검색
    // const classrooms = await Classroom.find({
    //   $or: [
    //     { title: { $regex: q, $options: 'i' } },
    //     { description: { $regex: q, $options: 'i' } }
    //   ],
    //   ...(category && { category }),
    //   ...(instructor && { instructor_name: { $regex: instructor, $options: 'i' } }),
    //   ...(isPublic !== undefined && { is_public: isPublic === 'true' })
    // }).limit(Number(limit)).skip((Number(page) - 1) * Number(limit));

    // 임시 강의실 검색 결과
    const classrooms = [
      {
        id: '1',
        title: 'JavaScript 기초 강의',
        description: 'JavaScript 프로그래밍 기초를 배우는 강의입니다.',
        category: '프로그래밍',
        instructor_id: '1',
        instructor_name: '김강사',
        is_public: true,
        max_students: 50,
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        title: 'Python 기초 강의',
        description: 'Python 프로그래밍 기초를 배우는 강의입니다.',
        category: '프로그래밍',
        instructor_id: '2',
        instructor_name: '이강사',
        is_public: true,
        max_students: 30,
        created_at: new Date().toISOString()
      }
    ];
    
    return res.json({
      success: true,
      data: {
        classrooms,
        total: classrooms.length,
        query: q,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: classrooms.length,
          totalPages: Math.ceil(classrooms.length / Number(limit))
        }
      }
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * 자료 검색
 */
export const searchMaterials = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q, type, author, classroomId, limit = 20, page = 1 } = req.query;
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        success: false,
        error: '검색어를 입력해주세요.'
      });
    }

    // 실제로는 DB에서 자료 검색
    // const materials = await Material.find({
    //   $or: [
    //     { title: { $regex: q, $options: 'i' } },
    //     { description: { $regex: q, $options: 'i' } }
    //   ],
    //   ...(type && { type }),
    //   ...(author && { author_name: { $regex: author, $options: 'i' } }),
    //   ...(classroomId && { classroom_id: classroomId })
    // }).limit(Number(limit)).skip((Number(page) - 1) * Number(limit));

    // 임시 자료 검색 결과
    const materials = [
      {
        id: '1',
        title: 'JavaScript 강의 자료',
        description: 'JavaScript 기초 강의 자료입니다.',
        type: 'file',
        url: '/uploads/js_material.pdf',
        author_id: '1',
        author_name: '김강사',
        classroom_id: '1',
        classroom_title: 'JavaScript 기초 강의',
        download_count: 15,
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        title: 'Python 참고 자료',
        description: 'Python 학습에 도움이 되는 참고 자료입니다.',
        type: 'link',
        url: 'https://example.com/python-guide',
        author_id: '2',
        author_name: '이강사',
        classroom_id: '2',
        classroom_title: 'Python 기초 강의',
        download_count: 8,
        created_at: new Date().toISOString()
      }
    ];
    
    return res.json({
      success: true,
      data: {
        materials,
        total: materials.length,
        query: q,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: materials.length,
          totalPages: Math.ceil(materials.length / Number(limit))
        }
      }
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * 스레드 검색
 */
export const searchThreads = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q, author, classroomId, limit = 20, page = 1 } = req.query;
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        success: false,
        error: '검색어를 입력해주세요.'
      });
    }

    // 실제로는 DB에서 스레드 검색
    // const threads = await Thread.find({
    //   $or: [
    //     { title: { $regex: q, $options: 'i' } },
    //     { content: { $regex: q, $options: 'i' } }
    //   ],
    //   ...(author && { author_name: { $regex: author, $options: 'i' } }),
    //   ...(classroomId && { classroom_id: classroomId })
    // }).limit(Number(limit)).skip((Number(page) - 1) * Number(limit));

    // 임시 스레드 검색 결과
    const threads = [
      {
        id: '1',
        title: 'JavaScript 질문',
        content: 'JavaScript에 대한 질문이 있습니다.',
        author_id: '3',
        author_name: '학생1',
        classroom_id: '1',
        classroom_title: 'JavaScript 기초 강의',
        view_count: 25,
        reply_count: 3,
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        title: 'Python 도움 요청',
        content: 'Python 코드에서 오류가 발생합니다.',
        author_id: '4',
        author_name: '학생2',
        classroom_id: '2',
        classroom_title: 'Python 기초 강의',
        view_count: 18,
        reply_count: 5,
        created_at: new Date().toISOString()
      }
    ];
    
    return res.json({
      success: true,
      data: {
        threads,
        total: threads.length,
        query: q,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: threads.length,
          totalPages: Math.ceil(threads.length / Number(limit))
        }
      }
    });
  } catch (err) {
    return next(err);
  }
}; 