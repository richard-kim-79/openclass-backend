import { Request, Response } from 'express';

/**
 * 스레드 목록 조회
 */
export const getThreads = async (req: Request, res: Response) => {
  try {
    const { classroomId } = req.params;
    const { page = 1, limit = 20, sort = 'created_at' } = req.query;

    if (!classroomId) {
      return res.status(400).json({ 
        success: false, 
        error: '강의실 ID가 필요합니다.' 
      });
    }

    // 실제로는 DB에서 스레드 목록 조회
    // const threads = await Thread.find({ classroom_id: classroomId })
    //   .sort({ [sort as string]: -1 })
    //   .limit(Number(limit))
    //   .skip((Number(page) - 1) * Number(limit));

    // 임시 스레드 데이터
    const threads = [
      {
        id: '1',
        classroom_id: classroomId,
        author_id: '1',
        author_name: '테스트 사용자',
        title: '첫 번째 스레드',
        content: '안녕하세요! 첫 번째 스레드입니다.',
        is_pinned: false,
        is_locked: false,
        view_count: 10,
        reply_count: 2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '2',
        classroom_id: classroomId,
        author_id: '2',
        author_name: '다른 사용자',
        title: '질문이 있습니다',
        content: '강의 내용에 대해 질문이 있습니다.',
        is_pinned: true,
        is_locked: false,
        view_count: 25,
        reply_count: 5,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    return res.json({
      success: true,
      data: {
        threads,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: threads.length,
          totalPages: Math.ceil(threads.length / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('스레드 목록 조회 실패:', error);
    return res.status(500).json({ 
      success: false, 
      error: '스레드 목록 조회 중 오류가 발생했습니다.' 
    });
  }
};

/**
 * 스레드 생성
 */
export const createThread = async (req: Request, res: Response) => {
  try {
    const { classroomId } = req.params;
    const { title, content } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: '인증되지 않은 사용자입니다.' 
      });
    }

    if (!classroomId) {
      return res.status(400).json({ 
        success: false, 
        error: '강의실 ID가 필요합니다.' 
      });
    }

    if (!title || !content) {
      return res.status(400).json({ 
        success: false, 
        error: '제목과 내용은 필수입니다.' 
      });
    }

    // 스레드 데이터 생성
    const threadData = {
      id: Date.now().toString(),
      classroom_id: classroomId,
      author_id: userId,
      author_name: req.user?.name || '사용자',
      title,
      content,
      is_pinned: false,
      is_locked: false,
      view_count: 0,
      reply_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // 실제로는 DB에 저장
    // const thread = await Thread.create(threadData);

    return res.status(201).json({
      success: true,
      message: '스레드가 생성되었습니다.',
      data: threadData
    });
  } catch (error) {
    console.error('스레드 생성 실패:', error);
    return res.status(500).json({ 
      success: false, 
      error: '스레드 생성 중 오류가 발생했습니다.' 
    });
  }
};

/**
 * 스레드 상세 조회
 */
export const getThread = async (req: Request, res: Response) => {
  try {
    const { classroomId, threadId } = req.params;

    if (!classroomId || !threadId) {
      return res.status(400).json({ 
        success: false, 
        error: '강의실 ID와 스레드 ID가 필요합니다.' 
      });
    }

    // 실제로는 DB에서 스레드 조회
    // const thread = await Thread.findById(threadId);
    // if (!thread || thread.classroom_id !== classroomId) {
    //   return res.status(404).json({ 
    //     success: false, 
    //     error: '스레드를 찾을 수 없습니다.' 
    //   });
    // }

    // 임시 스레드 데이터
    const thread = {
      id: threadId,
      classroom_id: classroomId,
      author_id: '1',
      author_name: '테스트 사용자',
      title: '테스트 스레드',
      content: '이것은 테스트 스레드의 내용입니다.',
      is_pinned: false,
      is_locked: false,
      view_count: 15,
      reply_count: 3,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return res.json({
      success: true,
      data: thread
    });
  } catch (error) {
    console.error('스레드 조회 실패:', error);
    return res.status(500).json({ 
      success: false, 
      error: '스레드 조회 중 오류가 발생했습니다.' 
    });
  }
};

/**
 * 스레드 수정
 */
export const updateThread = async (req: Request, res: Response) => {
  try {
    const { classroomId, threadId } = req.params;
    const { title, content } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: '인증되지 않은 사용자입니다.' 
      });
    }

    if (!classroomId || !threadId) {
      return res.status(400).json({ 
        success: false, 
        error: '강의실 ID와 스레드 ID가 필요합니다.' 
      });
    }

    if (!title && !content) {
      return res.status(400).json({ 
        success: false, 
        error: '수정할 내용을 입력해주세요.' 
      });
    }

    // 실제로는 DB에서 스레드 조회 및 권한 확인
    // const thread = await Thread.findById(threadId);
    // if (!thread || thread.classroom_id !== classroomId) {
    //   return res.status(404).json({ 
    //     success: false, 
    //     error: '스레드를 찾을 수 없습니다.' 
    //   });
    // }
    // if (thread.author_id !== userId) {
    //   return res.status(403).json({ 
    //     success: false, 
    //     error: '스레드를 수정할 권한이 없습니다.' 
    //   });
    // }

    // 업데이트할 데이터
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (title) updateData.title = title;
    if (content) updateData.content = content;

    // 실제로는 DB에서 업데이트
    // const updatedThread = await Thread.findByIdAndUpdate(threadId, updateData, { new: true });

    // 임시 업데이트된 데이터
    const updatedThread = {
      id: threadId,
      classroom_id: classroomId,
      author_id: userId,
      author_name: req.user?.name || '사용자',
      title: title || '테스트 스레드',
      content: content || '테스트 스레드 내용',
      is_pinned: false,
      is_locked: false,
      view_count: 15,
      reply_count: 3,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return res.json({
      success: true,
      message: '스레드가 수정되었습니다.',
      data: updatedThread
    });
  } catch (error) {
    console.error('스레드 수정 실패:', error);
    return res.status(500).json({ 
      success: false, 
      error: '스레드 수정 중 오류가 발생했습니다.' 
    });
  }
};

/**
 * 스레드 삭제
 */
export const deleteThread = async (req: Request, res: Response) => {
  try {
    const { classroomId, threadId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: '인증되지 않은 사용자입니다.' 
      });
    }

    if (!classroomId || !threadId) {
      return res.status(400).json({ 
        success: false, 
        error: '강의실 ID와 스레드 ID가 필요합니다.' 
      });
    }

    // 실제로는 DB에서 스레드 조회 및 권한 확인
    // const thread = await Thread.findById(threadId);
    // if (!thread || thread.classroom_id !== classroomId) {
    //   return res.status(404).json({ 
    //     success: false, 
    //     error: '스레드를 찾을 수 없습니다.' 
    //   });
    // }
    // if (thread.author_id !== userId) {
    //   return res.status(403).json({ 
    //     success: false, 
    //     error: '스레드를 삭제할 권한이 없습니다.' 
    //   });
    // }

    // 실제로는 DB에서 삭제
    // await Thread.findByIdAndDelete(threadId);

    return res.json({
      success: true,
      message: '스레드가 삭제되었습니다.'
    });
  } catch (error) {
    console.error('스레드 삭제 실패:', error);
    return res.status(500).json({ 
      success: false, 
      error: '스레드 삭제 중 오류가 발생했습니다.' 
    });
  }
}; 