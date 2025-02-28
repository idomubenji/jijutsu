import { Inter } from "next/font/google";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <main className="flex flex-col items-center justify-center w-full flex-1 px-5 text-center">
        <Card className="w-full max-w-md bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-xl border-0">
          <CardHeader>
            <CardTitle className="text-5xl font-bold tracking-tight text-gray-900 dark:text-white">
              字術へようこそ
            </CardTitle>
            <CardDescription className="text-xl text-gray-600 dark:text-gray-300">
              Welcome to Jijutsu
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-1 w-16 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full mx-auto mb-6"></div>
            <p className="text-md text-gray-500 dark:text-gray-400">
              Experience the art of characters
            </p>
          </CardContent>
          <CardFooter className="flex justify-center gap-4">
            <Button variant="default">Get Started</Button>
            <Button variant="outline">Learn More</Button>
          </CardFooter>
        </Card>
      </main>
      <footer className="w-full py-6 text-center text-sm text-gray-500 dark:text-gray-400">
        &copy; {new Date().getFullYear()} Jijutsu
      </footer>
    </div>
  );
}
