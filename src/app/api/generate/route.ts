import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';

type TaskStatus = 'pending' | 'completed' | 'failed';

interface Task {
  id: string;
  status: TaskStatus;
  result?: string | null;
  error?: string;
}

const tasks = new Map<string, Task>();

export async function POST(request: Request) {
  try {
    const { image, prompt, taskId } = await request.json();

    // 如果提供了taskId，返回任务状态
    if (taskId) {
      const task = tasks.get(taskId);
      if (!task) {
        return NextResponse.json({ error: '任务不存在' }, { status: 404 });
      }
      if (task.status === 'failed') {
        tasks.delete(taskId); // 清理失败的任务
        return NextResponse.json({ error: task.error }, { status: 500 });
      }
      if (task.status === 'completed') {
        const result = task.result;
        tasks.delete(taskId); // 清理完成的任务
        return NextResponse.json({ description: result });
      }
      return NextResponse.json({ status: task.status });
    }

    // 如果没有提供图片，返回错误
    if (!image) {
      return NextResponse.json(
        { error: '请提供图片' },
        { status: 400 }
      );
    }

    // 创建新任务
    const newTaskId = Math.random().toString(36).substring(7);
    tasks.set(newTaskId, { id: newTaskId, status: 'pending' });

    // 异步处理图片描述生成
    (async () => {
      try {
        const client = new OpenAI({
          baseURL: 'http://chatapi.littlewheat.com/v1',
          apiKey: 'sk-lef2ltAeYTNvjsUDyGWgIvO1L98gpSsaTFz1KDcdmrJAj4C0'
        });

        const completion = await client.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: prompt || '这张图片有什么'
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: image
                  }
                }
              ]
            }
          ],
          temperature: 0.7
        });

        tasks.set(newTaskId, {
          id: newTaskId,
          status: 'completed',
          result: completion.choices[0].message.content
        });
      } catch (error) {
        console.error('Error generating description:', error);
        tasks.set(newTaskId, {
          id: newTaskId,
          status: 'failed',
          error: '生成描述时发生错误'
        });
      }
    })();

    // 立即返回任务ID
    return NextResponse.json({ taskId: newTaskId, status: 'pending' });
  } catch (error) {
    console.error('Error handling request:', error);
    return NextResponse.json(
      { error: '处理请求时发生错误' },
      { status: 500 }
    );
  }
}