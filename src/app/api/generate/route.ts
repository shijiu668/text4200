import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { image, prompt } = await request.json();

    if (!image) {
      return NextResponse.json(
        { error: '请提供图片' },
        { status: 400 }
      );
    }

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

    return NextResponse.json({
      description: completion.choices[0].message.content
    });
  } catch (error) {
    console.error('Error generating description:', error);
    return NextResponse.json(
      { error: '生成描述时发生错误' },
      { status: 500 }
    );
  }
}