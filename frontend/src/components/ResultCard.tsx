import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ResultCardProps {
  summary: string;
  steps: string[];
}

export function ResultCard({ summary, steps }: ResultCardProps) {
  if (!summary) return null;

  return (
    <Card className="w-full max-w-md shadow-lg border-blue-100">
      <CardHeader className="bg-blue-50/50 rounded-t-xl pb-4">
        <CardTitle className="text-xl text-blue-900 leading-relaxed font-semibold">
          {summary}
        </CardTitle>
      </CardHeader>
      
      {steps && steps.length > 0 && (
        <CardContent className="pt-6">
          <h4 className="font-semibold text-gray-700 mb-4 tracking-wide text-sm uppercase">Step-by-step</h4>
          <ol className="relative border-s border-gray-200 ml-3 space-y-6">
            {steps.map((step, index) => (
              <li key={index} className="ms-6">
                <span className="absolute flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full -start-3 ring-8 ring-white">
                  <span className="text-blue-600 text-xs font-bold">{index + 1}</span>
                </span>
                <p className="text-gray-800 font-medium py-0.5">{step}</p>
              </li>
            ))}
          </ol>
        </CardContent>
      )}
    </Card>
  );
}
