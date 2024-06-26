'use client';

import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useCallback, useEffect, useState } from 'react';
import { QrGenerateRequest, QrGenerateResponse } from '@/utils/service';
import { QrCard } from '@/components/QrCard';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import LoadingDots from '@/components/ui/loadingdots';
import downloadQrCode from '@/utils/downloadQrCode';
import va from '@vercel/analytics';
import { PromptSuggestion } from '@/components/PromptSuggestion';
import { useRouter } from 'next/navigation';
import { toast, Toaster } from 'react-hot-toast';
import { createProdia } from 'prodia';

const promptSuggestions = [
  '绘制一个美女',
  '绘制一个动漫人物',
  '绘制一个帅哥',
  '绘制一个苹果',
];

const generateFormSchema = z.object({
  url: z.string().min(1),
  prompt: z.string().min(3).max(160),
});

type GenerateFormValues = z.infer<typeof generateFormSchema>;

const Body = ({
  imageUrl,
  prompt,
  redirectUrl,
  modelLatency,
  id,
}: {
  imageUrl?: string;
  prompt?: string;
  redirectUrl?: string;
  modelLatency?: number;
  id?: string;
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [response, setResponse] = useState<QrGenerateResponse | null>(null);
  const [submittedURL, setSubmittedURL] = useState<string | null>(null);
  const [isImage, setIsImage] = useState('');

  const router = useRouter();

  const form = useForm<GenerateFormValues>({
    resolver: zodResolver(generateFormSchema),
    mode: 'onChange',

    // Set default values so that the form inputs are controlled components.
    defaultValues: {
      url: '',
      prompt: '',
    },
  });

  useEffect(() => {
    if (imageUrl && prompt && redirectUrl && modelLatency && id) {
      setResponse({
        image_url: imageUrl,
        model_latency_ms: modelLatency,
        id: id,
      });
      setSubmittedURL(redirectUrl);

      form.setValue('prompt', prompt);
      form.setValue('url', redirectUrl);
    }
  }, [imageUrl, modelLatency, prompt, redirectUrl, id, form]);

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      form.setValue('prompt', suggestion);
    },
    [form],
  );

  const prodia = createProdia({
    apiKey: '48847940-aded-4214-9400-333c518105f0',
  });
  const prodiaImage = async () => {
    console.log('prodiaImage');
    const job = await prodia.generate({
      prompt: 'puppies in a cloud, 4k',
    });

    const { imageUrl, status } = await prodia.wait(job);
    console.log(imageUrl, status);
  };

  const imageGenerate = async (prompt1: string) => {
    setIsLoading(true);
    setSubmittedURL('true');
    const response = await fetch(
      `https://api-collect.idcdun.com/v1/images/generations?prompt=${prompt1}&n=1`,
      {
        method: 'GET',
      },
    );

    const data = await response.json();
    // 休息一下
    // await new Promise((resolve) => setTimeout(resolve, 8000));
    setIsImage(data.data[0].url);
    setIsLoading(false);
  };

  return (
    <div className="flex justify-center items-center flex-col w-full lg:p-0 p-4 sm:mb-28 mb-0">
      <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 mt-10">
        <div className="col-span-1">
          <h1 className="text-3xl font-bold mb-10">生成图片</h1>
          <Form {...form}>
            <form>
              <div className="flex flex-col gap-4">
                <FormField
                  control={form.control}
                  name="prompt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>提示词</FormLabel>
                      <FormControl>
                        <Textarea className="resize-none" {...field} />
                      </FormControl>
                      <FormDescription className="">
                        这里输入你的图片提示词
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* <div className="my-2">
                  <p className="text-sm font-medium mb-3">例子：</p>
                  <div className="grid sm:grid-cols-2 grid-cols-1 gap-3 text-center text-gray-500 text-sm">
                    {promptSuggestions.map((suggestion) => (
                      <PromptSuggestion
                        key={suggestion}
                        suggestion={suggestion}
                        onClick={() => handleSuggestionClick(suggestion)}
                        isLoading={isLoading}
                      />
                    ))}
                  </div>
                </div> */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex justify-center
                 max-w-[200px] mx-auto w-full"
                  onClick={() => {
                    // 函数在这里被调用
                    // prodiaImage();
                    imageGenerate(form.getValues().prompt);
                  }}
                >
                  {isLoading ? (
                    <LoadingDots color="white" />
                  ) : response ? (
                    '✨ 正在生成'
                  ) : (
                    '生成'
                  )}
                </Button>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error.message}</AlertDescription>
                  </Alert>
                )}
              </div>
            </form>
          </Form>
        </div>
        <div className="col-span-1">
          {submittedURL && (
            <>
              <h1 className="text-3xl font-bold sm:mb-5 mb-5 mt-5 sm:mt-0 sm:text-center text-left">
                你的图片
              </h1>
              <div>
                <div className="flex flex-col justify-center relative h-auto items-center">
                  {isImage ? (
                    <img
                      src={isImage}
                      style={{
                        borderRadius: '5%',
                      }}
                    />
                  ) : (
                    <div className="relative flex flex-col justify-center items-center gap-y-2 w-[510px] border border-gray-300 rounded shadow group p-2 mx-auto animate-pulse bg-gray-400 aspect-square max-w-full" />
                  )}
                </div>
                {response && (
                  <div className="flex justify-center gap-5 mt-4">
                    <Button onClick={() => downloadQrCode(isImage, 'qrCode')}>
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          `https://代码有点萌.io/start/${id || ''}`,
                        );
                        toast.success('Link copied to clipboard');
                      }}
                    >
                      ✂️ Share
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      <Toaster />
    </div>
  );
};

export default Body;
