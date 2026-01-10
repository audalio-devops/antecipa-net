import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md mx-auto text-center border-slate-200 shadow-xl">
        <CardContent className="pt-6 pb-8">
          <div className="flex justify-center mb-4">
            <AlertCircle className="h-12 w-12 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2 font-display">404 Página não encontrada</h1>
          <p className="text-slate-500 mb-6">
            A página que você está procurando não existe ou foi movida.
          </p>
          
          <Button asChild className="bg-slate-900 text-white hover:bg-slate-800">
            <Link href="/">
              Voltar para o Dashboard
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
