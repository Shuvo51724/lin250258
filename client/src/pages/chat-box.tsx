import { useState, useEffect, useRef } from 'react';
import { useChat } from '@/contexts/ChatContext';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  MessageCircle,
  Send,
  Paperclip,
  Users,
  Pin,
  MoreVertical,
  Ban,
  VolumeX,
  Check,
  CheckCheck,
  Wifi,
  WifiOff,
  Reply,
  X,
  AtSign,
} from 'lucide-react';
import DashboardHeader from '@/components/DashboardHeader';
import Footer from '@/components/Footer';

export default function ChatBoxPage() {
  const { user, userRole } = useAuth();
  const {
    messages,
    onlineUsers,
    isConnected,
    settings,
    sendMessage,
    sendTypingIndicator,
    markMessageAsRead,
    pinMessage,
    blockUser,
    muteUser,
    isUserBlocked,
    isUserMuted,
  } = useChat();

  const [messageInput, setMessageInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showUserList, setShowUserList] = useState(false);
  const [blockDialogUser, setBlockDialogUser] = useState<{ userId: string; userName: string } | null>(null);
  const [muteDialogUser, setMuteDialogUser] = useState<{ userId: string; userName: string } | null>(null);
  const [replyingTo, setReplyingTo] = useState<{ messageId: string; userName: string; message: string } | null>(null);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [mentionPosition, setMentionPosition] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isAdmin = userRole === 'admin';
  const isModerator = userRole === 'moderator' || userRole === 'admin';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (user) {
      const unreadMessages = messages.filter(
        msg => msg.userId !== user.userId && !msg.readBy.includes(user.userId)
      );
      unreadMessages.forEach(msg => markMessageAsRead(msg.id));
    }
  }, [messages, user, markMessageAsRead]);

  const extractMentions = (text: string): string[] => {
    const mentionRegex = /@\[([^\]]+)\]/g;
    const matches = Array.from(text.matchAll(mentionRegex));
    return matches.map(m => m[1]);
  };

  const handleSendMessage = () => {
    if (!messageInput.trim() && !selectedFile) return;
    
    if (settings.moderatorOnlyMode && !isModerator) {
      return;
    }

    if (user && isUserMuted(user.userId)) {
      return;
    }

    const mentions = extractMentions(messageInput);
    sendMessage(messageInput, selectedFile || undefined, replyingTo || undefined, mentions);
    setMessageInput('');
    setSelectedFile(null);
    setReplyingTo(null);
  };

  const handleInputChange = (value: string) => {
    setMessageInput(value);

    const lastAtSymbol = value.lastIndexOf('@');
    if (lastAtSymbol !== -1) {
      const textAfterAt = value.substring(lastAtSymbol + 1);
      const hasClosingBracket = textAfterAt.includes(']');
      
      if (!hasClosingBracket && textAfterAt.startsWith('[')) {
        const filterText = textAfterAt.substring(1);
        setMentionFilter(filterText.toLowerCase());
        setShowMentions(true);
        setMentionPosition(lastAtSymbol);
      } else if (textAfterAt === '' || textAfterAt === '[') {
        setMentionFilter('');
        setShowMentions(true);
        setMentionPosition(lastAtSymbol);
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    sendTypingIndicator(true);

    typingTimeoutRef.current = setTimeout(() => {
      sendTypingIndicator(false);
    }, 1000);
  };

  const handleMentionSelect = (userName: string) => {
    const beforeMention = messageInput.substring(0, mentionPosition);
    let afterMentionStart = mentionPosition + 1;
    
    if (messageInput[afterMentionStart] === '[') {
      const closingBracket = messageInput.indexOf(']', afterMentionStart);
      if (closingBracket !== -1) {
        afterMentionStart = closingBracket + 1;
      } else {
        afterMentionStart = mentionPosition + 2 + mentionFilter.length;
      }
    } else {
      afterMentionStart = mentionPosition + 1;
    }
    
    const afterMention = messageInput.substring(afterMentionStart);
    setMessageInput(`${beforeMention}@[${userName}] ${afterMention}`);
    setShowMentions(false);
    inputRef.current?.focus();
  };

  const filteredOnlineUsers = onlineUsers.filter(u => 
    u.userId !== user?.userId && 
    u.userName.toLowerCase().includes(mentionFilter)
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const pinnedMessages = messages.filter(msg => msg.isPinned);
  const regularMessages = messages.filter(msg => !msg.isPinned);

  if (!settings.enabled) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <DashboardHeader />
        <div className="w-full px-6 py-6 flex-1">
          <div className="max-w-7xl mx-auto">
            <Card className="shadow-sm">
              <CardContent className="py-12 text-center text-muted-foreground">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg font-medium">Chat is currently disabled</p>
                <p className="text-sm mt-2">Please contact an administrator to enable the chat feature</p>
              </CardContent>
            </Card>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <DashboardHeader />
      <div className="w-full px-6 py-6 flex-1">
        <div className="max-w-7xl mx-auto h-full">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Team Chat</h1>
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                Real-time communication with your team
                {isConnected ? (
                  <Badge variant="outline" className="gap-1 bg-green-100 text-green-800 border-green-300">
                    <Wifi className="w-3 h-3" />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1 bg-red-100 text-red-800 border-red-300">
                    <WifiOff className="w-3 h-3" />
                    Disconnected
                  </Badge>
                )}
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setShowUserList(!showUserList)}
              className="gap-2"
            >
              <Users className="w-4 h-4" />
              {onlineUsers.length} Online
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <Card className="shadow-sm h-[calc(100vh-16rem)]">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MessageCircle className="w-5 h-5" />
                      Messages
                    </CardTitle>
                  </div>
                </CardHeader>
                <Separator />
                <CardContent className="p-0 flex flex-col h-[calc(100%-4rem)]">
                  <ScrollArea className="flex-1 px-4">
                    <div className="space-y-4 py-4">
                      {pinnedMessages.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Pin className="w-4 h-4" />
                            <span>Pinned Messages</span>
                          </div>
                          {pinnedMessages.map(msg => (
                            <MessageItem
                              key={msg.id}
                              msg={msg}
                              currentUser={user}
                              isAdmin={isAdmin}
                              onPin={pinMessage}
                              onBlock={setBlockDialogUser}
                              onMute={setMuteDialogUser}
                              onReply={(msgId, userName, message) => setReplyingTo({ messageId: msgId, userName, message })}
                            />
                          ))}
                          <Separator className="my-4" />
                        </div>
                      )}
                      
                      {regularMessages.map(msg => (
                        <MessageItem
                          key={msg.id}
                          msg={msg}
                          currentUser={user}
                          isAdmin={isAdmin}
                          onPin={pinMessage}
                          onBlock={setBlockDialogUser}
                          onMute={setMuteDialogUser}
                          onReply={(msgId, userName, message) => setReplyingTo({ messageId: msgId, userName, message })}
                        />
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  <div className="border-t p-4">
                    {replyingTo && (
                      <div className="flex items-start gap-2 mb-2 p-2 bg-muted rounded border-l-4 border-primary">
                        <Reply className="w-4 h-4 mt-0.5" />
                        <div className="flex-1">
                          <div className="text-xs font-medium">Replying to {replyingTo.userName}</div>
                          <div className="text-xs text-muted-foreground truncate">{replyingTo.message}</div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setReplyingTo(null)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}

                    {selectedFile && (
                      <div className="flex items-center gap-2 mb-2 p-2 bg-muted rounded">
                        <Paperclip className="w-4 h-4" />
                        <span className="text-sm flex-1">{selectedFile.name}</span>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setSelectedFile(null)}
                        >
                          Remove
                        </Button>
                      </div>
                    )}

                    <div className="relative">
                      {showMentions && filteredOnlineUsers.length > 0 && (
                        <div className="absolute bottom-full left-0 right-0 mb-2 bg-background border rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                          <div className="p-2 space-y-1">
                            {filteredOnlineUsers.map(u => (
                              <button
                                key={u.userId}
                                onClick={() => handleMentionSelect(u.userName)}
                                className="w-full flex items-center gap-2 p-2 hover:bg-muted rounded text-left"
                              >
                                <AtSign className="w-4 h-4" />
                                <span className="font-medium">{u.userName}</span>
                                <Badge variant="outline" className="text-xs ml-auto">
                                  {u.userRole}
                                </Badge>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                        <Input
                          ref={inputRef}
                          placeholder={
                            settings.moderatorOnlyMode && !isModerator
                              ? "Only moderators can send messages"
                              : user && isUserMuted(user.userId)
                              ? "You are muted"
                              : "Type a message... (@[ to mention)"
                          }
                          value={messageInput}
                          onChange={(e) => handleInputChange(e.target.value)}
                          onKeyPress={handleKeyPress}
                          disabled={
                            (settings.moderatorOnlyMode && !isModerator) ||
                            (user ? isUserMuted(user.userId) : false)
                          }
                        />
                        {settings.fileSharingEnabled && (
                          <>
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*,application/pdf,.doc,.docx"
                              onChange={handleFileSelect}
                              className="hidden"
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={
                                (settings.moderatorOnlyMode && !isModerator) ||
                                (user ? isUserMuted(user.userId) : false)
                              }
                            >
                              <Paperclip className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        <Button 
                          onClick={handleSendMessage}
                          disabled={
                            (!messageInput.trim() && !selectedFile) ||
                            (settings.moderatorOnlyMode && !isModerator) ||
                            (user ? isUserMuted(user.userId) : false)
                          }
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {showUserList && (
              <div className="lg:col-span-1">
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Online Users</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[calc(100vh-20rem)]">
                      <div className="space-y-2">
                        {onlineUsers.map(u => (
                          <div
                            key={u.userId}
                            className="flex items-center gap-2 p-2 rounded hover:bg-muted"
                          >
                            <div className={`w-2 h-2 rounded-full ${u.status === 'online' ? 'bg-green-500' : 'bg-gray-400'}`} />
                            <div className="flex-1">
                              <div className="text-sm font-medium">{u.userName}</div>
                              <Badge variant="outline" className="text-xs">
                                {u.userRole}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />

      <AlertDialog open={!!blockDialogUser} onOpenChange={() => setBlockDialogUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Block User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to block {blockDialogUser?.userName}? They will not be able to send messages.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (blockDialogUser) {
                  blockUser(blockDialogUser.userId, blockDialogUser.userName);
                  setBlockDialogUser(null);
                }
              }}
            >
              Block User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!muteDialogUser} onOpenChange={() => setMuteDialogUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mute User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mute {muteDialogUser?.userName}? They will not be able to send messages.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (muteDialogUser) {
                  muteUser(muteDialogUser.userId, muteDialogUser.userName);
                  setMuteDialogUser(null);
                }
              }}
            >
              Mute User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface MessageItemProps {
  msg: any;
  currentUser: any;
  isAdmin: boolean;
  onPin: (messageId: string, isPinned: boolean) => void;
  onBlock: (user: { userId: string; userName: string }) => void;
  onMute: (user: { userId: string; userName: string }) => void;
  onReply: (messageId: string, userName: string, message: string) => void;
}

function MessageItem({ msg, currentUser, isAdmin, onPin, onBlock, onMute, onReply }: MessageItemProps) {
  const isOwnMessage = msg.userId === currentUser?.userId;
  const isRead = msg.readBy.length > 1;

  const renderMessage = (text: string) => {
    const parts = text.split(/(@\[[^\]]+\])/g);
    return parts.map((part, index) => {
      if (part.match(/^@\[.+\]$/)) {
        return (
          <span key={index} className="font-semibold bg-primary/20 px-1 rounded">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{msg.userName}</span>
          <Badge variant="outline" className="text-xs">
            {msg.userRole}
          </Badge>
          {msg.isPinned && <Pin className="w-3 h-3 text-primary" />}
        </div>
        
        <div className={`rounded-lg p-3 ${
          isOwnMessage 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-muted'
        }`}>
          {msg.replyTo && (
            <div className="mb-2 p-2 bg-black/10 rounded border-l-2 border-primary/50">
              <div className="text-xs font-medium opacity-80">
                Replying to {msg.replyTo.userName}
              </div>
              <div className="text-xs opacity-70 truncate">
                {msg.replyTo.message}
              </div>
            </div>
          )}
          
          {msg.fileUrl && (
            <div className="mb-2">
              {msg.fileName?.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                <img 
                  src={msg.fileUrl} 
                  alt={msg.fileName} 
                  className="max-w-full rounded"
                />
              ) : (
                <a 
                  href={msg.fileUrl} 
                  download={msg.fileName}
                  className="flex items-center gap-2 text-sm underline"
                >
                  <Paperclip className="w-4 h-4" />
                  {msg.fileName}
                </a>
              )}
            </div>
          )}
          
          {msg.message && (
            <p className="text-sm whitespace-pre-wrap break-words">{renderMessage(msg.message)}</p>
          )}
          
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs opacity-70">
              {format(new Date(msg.timestamp), 'p')}
            </span>
            {isOwnMessage && (
              <span className="text-xs opacity-70">
                {isRead ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />}
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-1">
          {!isOwnMessage && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 text-xs"
              onClick={() => onReply(msg.id, msg.userName, msg.message || 'file attachment')}
            >
              <Reply className="w-3 h-3 mr-1" />
              Reply
            </Button>
          )}
          
          {isAdmin && !isOwnMessage && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6">
                  <MoreVertical className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onPin(msg.id, !msg.isPinned)}>
                  <Pin className="w-4 h-4 mr-2" />
                  {msg.isPinned ? 'Unpin' : 'Pin'} Message
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onBlock({ userId: msg.userId, userName: msg.userName })}>
                  <Ban className="w-4 h-4 mr-2" />
                  Block User
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onMute({ userId: msg.userId, userName: msg.userName })}>
                  <VolumeX className="w-4 h-4 mr-2" />
                  Mute User
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </div>
  );
}
