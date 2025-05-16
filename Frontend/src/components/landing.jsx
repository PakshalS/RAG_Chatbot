import { Link } from "react-router-dom"
import { ArrowRight, FileText, MessageSquare, Shield, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import useAuthRedirect from "@/context/useauthredirect";
export default function LandingPage() {
  useAuthRedirect();
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-white/80 dark:bg-gray-950/80 backdrop-blur-md sticky top-0 z-50 transition-all duration-300">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">PDFChat</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-medium hover:text-primary transition-all duration-300">
              Login
            </Link>
            <Link to="/signup">
              <Button className="transition-all duration-300 hover:scale-105">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="py-20 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5 -z-10 transition-all duration-300" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl -z-10" />

        <div className="container mx-auto px-4 flex flex-col items-center text-center">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-fade-in">
            <span className="relative flex h-2 w-2 mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Intelligent PDF Chat Assistant
          </div>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 max-w-4xl animate-fade-in-up">
            Chat with your <span className="text-primary">PDF documents</span> using AI
          </h1>

          <p
            className="text-lg text-gray-600 dark:text-gray-300 mb-10 max-w-2xl animate-fade-in-up"
            style={{ animationDelay: "0.2s" }}
          >
            Upload your PDFs and instantly start asking questions. Get accurate answers powered by advanced AI that
            understands your documents.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-16 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
            <Link to="/signup">
              <Button size="lg" className="group w-full sm:w-auto transition-all duration-300 hover:shadow-lg">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/login">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto transition-all duration-300 hover:shadow-md"
              >
                Login to Dashboard
              </Button>
            </Link>
          </div>

          <div
            className="relative w-full max-w-4xl mx-auto rounded-xl overflow-hidden shadow-2xl group animate-fade-in-up"
            style={{ animationDelay: "0.4s" }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10"></div>
<></>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white dark:bg-gray-950 transition-all duration-300">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Powerful Features
            </h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto transition-all duration-300">
              Everything you need to interact with your PDF documents intelligently
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <FileText className="h-10 w-10 text-primary" />,
                title: "PDF Processing",
                description: "Upload multiple PDFs and our system will process them for instant querying.",
              },
              {
                icon: <MessageSquare className="h-10 w-10 text-primary" />,
                title: "Intelligent Chat",
                description: "Ask questions in natural language and get accurate answers from your documents.",
              },
              {
                icon: <Zap className="h-10 w-10 text-primary" />,
                title: "Instant Responses",
                description: "Get immediate answers with our high-performance AI processing engine.",
              },
              {
                icon: <Shield className="h-10 w-10 text-primary" />,
                title: "Secure Processing",
                description: "Your documents are processed securely and never shared with third parties.",
              },
              {
                icon: <FileText className="h-10 w-10 text-primary" />,
                title: "Document History",
                description: "Access your previously uploaded documents and conversations anytime.",
              },
              {
                icon: <MessageSquare className="h-10 w-10 text-primary" />,
                title: "Contextual Understanding",
                description: "Our AI understands the context of your questions for more accurate answers.",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-primary/50 dark:hover:border-primary/50 hover:shadow-lg transition-all duration-300 group animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="mb-4 p-3 rounded-lg bg-primary/10 inline-block group-hover:bg-primary/20 transition-all duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 transition-all duration-300">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 transition-all duration-300">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 animate-fade-in-up">Ready to chat with your PDFs?</h2>
          <p
            className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto transition-all duration-300 animate-fade-in-up"
            style={{ animationDelay: "0.1s" }}
          >
            Join thousands of users who are already getting answers from their documents instantly.
          </p>
          <Link to="/signup">
            <Button
              size="lg"
              className="group transition-all duration-300 hover:shadow-lg animate-fade-in-up"
              style={{ animationDelay: "0.2s" }}
            >
              Get Started Now
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="bg-gray-50 dark:bg-gray-900 py-12 mt-auto transition-all duration-300">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <FileText className="h-5 w-5 text-primary" />
              <span className="font-bold text-lg">PDFChat</span>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 transition-all duration-300">
              © {new Date().getFullYear()} PDFChat. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}