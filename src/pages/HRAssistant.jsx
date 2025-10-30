import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Bot, Send, MessageCircle } from "lucide-react";

export default function HRAssistant() {
  const [user, setUser] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        // Create or load conversation
        const conversations = await base44.agents.listConversations({ agent_name: 'hr_assistant' });
        if (conversations.length > 0) {
          const conv = await base44.agents.getConversation(conversations[0].id);
          setConversation(conv);
          setMessages(conv.messages || []);
        } else {
          const newConv = await base44.agents.createConversation({
            agent_name: 'hr_assistant',
            metadata: {
              name: 'HR Assistant Chat',
              description: `Chat with ${currentUser.full_name}`,
            }
          });
          setConversation(newConv);
          setMessages([]);
        }
      } catch (error) {
        console.error("Error loading:", error);
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    if (!conversation) return;
    
    const unsubscribe = base44.agents.subscribeToConversation(conversation.id, (data) => {
      setMessages(data.messages);
    });

    return () => unsubscribe();
  }, [conversation]);

  const handleSend = async () => {
    if (!input.trim() || !conversation) return;
    
    setSending(true);
    try {
      await base44.agents.addMessage(conversation, {
        role: 'user',
        content: input,
      });
      setInput('');
    } catch (error) {
      console.error("Error sending:", error);
    }
    setSending(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm mb-4">
            <Bot className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-slate-700">AI HR Assistant</span>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-3">HR Assistant</h1>
          <p className="text-lg text-slate-600">Ask me anything about HR policies, leave, payroll, and more</p>
        </div>

        <Card className="border-slate-200 shadow-xl">
          <CardContent className="p-0">
            <div className="h-[500px] overflow-y-auto p-6 space-y-4">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-slate-100 text-slate-900'
                  }`}>
                    <p className="text-sm">{msg.content}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="border-t p-4 flex gap-3">
              <Textarea
                placeholder="Ask me anything about HR..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                rows={2}
                className="resize-none"
              />
              <Button onClick={handleSend} disabled={sending || !input.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}