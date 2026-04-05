"use client";

import { Card, CardContent } from "@/components/ui/card";

interface CalculatorShellProps {
  inputPanel: React.ReactNode;
  resultPanel: React.ReactNode;
  inputCols?: 5 | 7;
  resultCols?: 5 | 7;
}

export function CalculatorShell({
  inputPanel,
  resultPanel,
  inputCols = 7,
  resultCols = 5,
}: CalculatorShellProps) {
  const inputColClass =
    inputCols === 5 ? "lg:col-span-5" : "lg:col-span-7";
  const resultColClass =
    resultCols === 5 ? "lg:col-span-5" : "lg:col-span-7";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <section className={inputColClass}>
        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-6">{inputPanel}</div>
          </CardContent>
        </Card>
      </section>

      <section
        className={`${resultColClass} lg:sticky lg:top-28 space-y-4`}
      >
        {resultPanel}
      </section>
    </div>
  );
}
