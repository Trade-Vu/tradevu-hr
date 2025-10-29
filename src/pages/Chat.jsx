import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { MessageCircle, Send, Plus, Search, Users, Paperclip } from "lucide-react";
import { format } from "date-fns";

export default function Chat() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [newChatType, setNewChatType] = useState('direct');
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [groupName, setGroupName] = useState('');

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.error("Error loading user:", error);
      }
    };
    loadUser();
  }, []);

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.list(),
    initialData: [],
  });

  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations', user?.email],
    queryFn: async () => {
      const allConvos = await base44.entities.Conversation.list('-last_message_time');
      return allConvos.filter(c => c.participants.includes(user.email));
    },
    enabled: !!user,
    initialData: [],
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['messages', selectedConversation?.id],
    queryFn: async () => {
      const allMessages = await base44.entities.ChatMessage.list('created_date');
      return allMessages.filter(m => m.conversation_id === selectedConversation.id);
    },
    enabled: !!selectedConversation,
    initialData: [],
  });

  const createConversationMutation = useMutation({
    mutationFn: (data) => base44.entities.Conversation.create(data),
    onSuccess: (newConversation) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setShowNewChatDialog(false);
      setSelectedParticipants([]);
      setGroupName('');
      setSelectedConversation(newConversation);
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data) => {
      const message = await base44.entities.ChatMessage.create(data);
      
      await base44.entities.Conversation.update(selectedConversation.id, {
        last_message: data.message,
        last_message_time: new Date().toISOString(),
      });
      
      return message;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setMessageText('');
    },
  });

  const handleCreateConversation = () => {
    if (selectedParticipants.length === 0) return;

    const participants = [...selectedParticipants, user.email];
    
    createConversationMutation.mutate({
      organization_id: user.organization_id,
      conversation_type: selectedParticipants.length === 1 ? 'direct' : 'group',
      participants,
      group_name: selectedParticipants.length > 1 ? groupName : null,
      group_admin: selectedParticipants.length > 1 ? user.email : null,
    });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedConversation) return;

    sendMessageMutation.mutate({
      organization_id: user.organization_id,
      conversation_id: selectedConversation.id,
      sender_email: user.email,
      sender_name: user.full_name,
      message: messageText,
      message_type: 'text',
      timestamp: new Date().toISOString(),
    });
  };

  const toggleParticipant = (email) => {
    setSelectedParticipants(prev => 
      prev.includes(email) 
        ? prev.filter(e => e !== email)
        : [...prev, email]
    );
  };

  const filteredConversations = conversations.filter(conv => {
    if (!searchTerm) return true;
    return conv.group_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           conv.participants.some(p => p.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden" style={{ height: 'calc(100vh - 8rem)' }}>
          <div className="flex h-full">
            {/* Conversations List */}
            <div className="w-80 border-r border-slate-200 flex flex-col">
              <div className="p-4 border-b border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-slate-900">Messages</h2>
                  <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>New Conversation</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        {selectedParticipants.length > 1 && (
                          <div className="space-y-2">
                            <Label>Group Name</Label>
                            <Input
                              placeholder="Enter group name..."
                              value={groupName}
                              onChange={(e) => setGroupName(e.target.value)}
                            />
                          </div>
                        )}
                        <div className="space-y-2">
                          <Label>Select People</Label>
                          <div className="max-h-64 overflow-y-auto space-y-2 border border-slate-200 rounded-lg p-3">
                            {employees
                              .filter(emp => emp.email !== user?.email)
                              .map(emp => (
                                <div key={emp.id} className="flex items-center gap-3">
                                  <Checkbox
                                    checked={selectedParticipants.includes(emp.email)}
                                    onCheckedChange={() => toggleParticipant(emp.email)}
                                  />
                                  <div className="flex items-center gap-2 flex-1">
                                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-xs">
                                      {emp.full_name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-slate-900">{emp.full_name}</p>
                                      <p className="text-xs text-slate-500">{emp.job_title}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                        <Button 
                          onClick={handleCreateConversation}
                          disabled={selectedParticipants.length === 0 || createConversationMutation.isPending}
                          className="w-full"
                        >
                          {createConversationMutation.isPending ? 'Creating...' : 'Create Conversation'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {filteredConversations.length === 0 ? (
                  <div className="p-8 text-center">
                    <MessageCircle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p className="text-slate-500 text-sm">No conversations yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {filteredConversations.map(conv => (
                      <div
                        key={conv.id}
                        onClick={() => setSelectedConversation(conv)}
                        className={`p-4 cursor-pointer hover:bg-slate-50 transition-colors ${
                          selectedConversation?.id === conv.id ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                            {conv.conversation_type === 'group' ? (
                              <Users className="w-5 h-5" />
                            ) : (
                              conv.participants.find(p => p !== user?.email)?.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-semibold text-slate-900 text-sm truncate">
                                {conv.group_name || conv.participants.find(p => p !== user?.email)?.split('@')[0]}
                              </h4>
                              {conv.last_message_time && (
                                <span className="text-xs text-slate-500">
                                  {format(new Date(conv.last_message_time), 'h:mm a')}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-600 truncate">
                              {conv.last_message || 'No messages yet'}
                            </p>
                          </div>
                          {conv.unread_count?.[user?.email] > 0 && (
                            <Badge className="bg-blue-600 text-white">
                              {conv.unread_count[user.email]}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-slate-200 bg-slate-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {selectedConversation.conversation_type === 'group' ? (
                            <Users className="w-5 h-5" />
                          ) : (
                            selectedConversation.participants.find(p => p !== user?.email)?.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900">
                            {selectedConversation.group_name || 
                             selectedConversation.participants.find(p => p !== user?.email)?.split('@')[0]}
                          </h3>
                          <p className="text-xs text-slate-500">
                            {selectedConversation.conversation_type === 'group' 
                              ? `${selectedConversation.participants.length} members`
                              : 'Direct message'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map(msg => {
                      const isOwn = msg.sender_email === user?.email;
                      return (
                        <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-md ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                            {!isOwn && (
                              <span className="text-xs text-slate-500 px-2">{msg.sender_name}</span>
                            )}
                            <div className={`rounded-2xl px-4 py-2 ${
                              isOwn 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-slate-100 text-slate-900'
                            }`}>
                              <p className="text-sm">{msg.message}</p>
                            </div>
                            <span className="text-xs text-slate-400 px-2">
                              {format(new Date(msg.timestamp || msg.created_date), 'h:mm a')}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-slate-200 bg-white">
                    <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                      <Button type="button" variant="ghost" size="icon">
                        <Paperclip className="w-5 h-5" />
                      </Button>
                      <Input
                        placeholder="Type a message..."
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        className="flex-1"
                      />
                      <Button 
                        type="submit" 
                        disabled={!messageText.trim() || sendMessageMutation.isPending}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageCircle className="w-20 h-20 mx-auto mb-4 text-slate-300" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      Select a conversation
                    </h3>
                    <p className="text-slate-500">
                      Choose a conversation to start messaging
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}