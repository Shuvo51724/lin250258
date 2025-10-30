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
  X,
  Send,
  Paperclip,
  Users,
  Pin,
  MoreVertical,
  Ban,
  VolumeX,
  Trash2,
  Check,
  CheckCheck,
} from 'lucide-react';

interface ChatBoxProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChatBox({ isOpen, onClose }: ChatBoxProps) {
  const { user } = useAuth();
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && user) {
      const unreadMessages = messages.filter(
        msg => msg.userId !== user.userId && !msg.readBy.includes(user.userId)
      );
      unreadMessages.forEach(msg => markMessageAsRead(msg.id));
    }
  }, [isOpen, messages, user, markMessageAsRead]);

  const handleSendMessage = () => {
    if (!messageInput.trim() && !selectedFile) return;
    
    if (settings.moderatorOnlyMode && user?.role !== 'admin' && user?.role !== 'moderator') {
      return;
    }

    if (user && isUserMuted(user.userId)) {
      return;
    }

    sendMessage(messageInput, selectedFile || undefined);
    setMessageInput('');
    setSelectedFile(null);
  };

  const handleInputChange = (value: string) => {
    setMessageInput(value);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    sendTypingIndicator(true);

    typingTimeoutRef.current = setTimeout(() => {
      sendTypingIndicator(false);
    }, 1000);
  };

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

  const handlePinMessage = (messageId: string, isPinned: boolean) => {
    if (user?.role === 'admin') {
      pinMessage(messageId, !isPinned);
    }
  };

  const handleBlockUser = (userId: string, userName: string) => {
    setBlockDialogUser({ userId, userName });
  };

  const handleMuteUser = (userId: string, userName: string) => {
    setMuteDialogUser({ userId, userName });
  };

  const confirmBlockUser = () => {
    if (blockDialogUser && user?.role === 'admin') {
      blockUser(blockDialogUser.userId, blockDialogUser.userName);
      setBlockDialogUser(null);
    }
  };

  const confirmMuteUser = () => {
    if (muteDialogUser && user?.role === 'admin') {
      muteUser(muteDialogUser.userId, muteDialogUser.userName);
      setMuteDialogUser(null);
    }
  };

  const pinnedMessages = messages.filter(msg => msg.isPinned);
  const regularMessages = messages.filter(msg => !msg.isPinned);

  if (!isOpen) return null;

  return (
    <>
      <Card className="fixed bottom-4 right-4 w-96 h-[600px] shadow-2xl z-50 flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            <CardTitle className="text-lg">Chat Box</CardTitle>
            {isConnected && (
              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                Online
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowUserList(!showUserList)}
            >
              <Users className="h-4 w-4" />
              <span className="ml-1 text-xs">{onlineUsers.length}</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 p-0 overflow-hidden flex flex-col">
          {showUserList ? (
            <ScrollArea className="flex-1 p-4">
              <h3 className="font-semibold mb-2">Online Users ({onlineUsers.length})</h3>
              <div className="space-y-2">
                {onlineUsers.map(onlineUser => (
                  <div key={onlineUser.userId} className="flex items-center justify-between p-2 rounded hover:bg-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      <span className="font-medium">{onlineUser.userName}</span>
                      <Badge variant="secondary" className="text-xs">
                        {onlineUser.userRole}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <>
              <ScrollArea className="flex-1 p-4">
                {pinnedMessages.length > 0 && (
                  <>
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Pin className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm font-semibold text-yellow-600">Pinned Messages</span>
                      </div>
                      {pinnedMessages.map(msg => (
                        <div key={msg.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-2">
                          <MessageItem
                            message={msg}
                            currentUserId={user?.userId || ''}
                            isAdmin={user?.role === 'admin'}
                            onPin={handlePinMessage}
                            onBlock={handleBlockUser}
                            onMute={handleMuteUser}
                            isBlocked={isUserBlocked(msg.userId)}
                            isMuted={isUserMuted(msg.userId)}
                          />
                        </div>
                      ))}
                    </div>
                    <Separator className="my-4" />
                  </>
                )}

                <div className="space-y-3">
                  {regularMessages.map(msg => (
                    <MessageItem
                      key={msg.id}
                      message={msg}
                      currentUserId={user?.userId || ''}
                      isAdmin={user?.role === 'admin'}
                      onPin={handlePinMessage}
                      onBlock={handleBlockUser}
                      onMute={handleMuteUser}
                      isBlocked={isUserBlocked(msg.userId)}
                      isMuted={isUserMuted(msg.userId)}
                    />
                  ))}
                </div>
                <div ref={messagesEndRef} />
              </ScrollArea>

              <div className="border-t p-4">
                {settings.moderatorOnlyMode && user?.role !== 'admin' && user?.role !== 'moderator' && (
                  <div className="mb-2 p-2 bg-yellow-100 text-yellow-800 text-sm rounded">
                    Only moderators can send messages right now
                  </div>
                )}
                {user && isUserMuted(user.userId) && (
                  <div className="mb-2 p-2 bg-red-100 text-red-800 text-sm rounded">
                    You have been muted and cannot send messages
                  </div>
                )}
                {selectedFile && (
                  <div className="mb-2 p-2 bg-gray-100 rounded flex items-center justify-between">
                    <span className="text-sm truncate">{selectedFile.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedFile(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <div className="flex gap-2">
                  {settings.fileSharingEnabled && (
                    <>
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={handleFileSelect}
                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={!isConnected || (user && isUserMuted(user.userId))}
                      >
                        <Paperclip className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  <Input
                    value={messageInput}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type a message..."
                    disabled={!isConnected || (user && isUserMuted(user.userId))}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!isConnected || (!messageInput.trim() && !selectedFile) || (user && isUserMuted(user.userId))}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

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
            <AlertDialogAction onClick={confirmBlockUser}>Block</AlertDialogAction>
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
            <AlertDialogAction onClick={confirmMuteUser}>Mute</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

interface MessageItemProps {
  message: any;
  currentUserId: string;
  isAdmin: boolean;
  onPin: (messageId: string, isPinned: boolean) => void;
  onBlock: (userId: string, userName: string) => void;
  onMute: (userId: string, userName: string) => void;
  isBlocked: boolean;
  isMuted: boolean;
}

function MessageItem({
  message,
  currentUserId,
  isAdmin,
  onPin,
  onBlock,
  onMute,
  isBlocked,
  isMuted,
}: MessageItemProps) {
  const isOwnMessage = message.userId === currentUserId;

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[75%] ${isOwnMessage ? 'bg-blue-500 text-white' : 'bg-gray-100'} rounded-lg p-3`}>
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">{message.userName}</span>
            <Badge variant="secondary" className="text-xs">
              {message.userRole}
            </Badge>
            {isBlocked && <Badge variant="destructive" className="text-xs">Blocked</Badge>}
            {isMuted && <Badge variant="outline" className="text-xs">Muted</Badge>}
          </div>
          {isAdmin && !isOwnMessage && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => onPin(message.id, message.isPinned)}>
                  <Pin className="h-4 w-4 mr-2" />
                  {message.isPinned ? 'Unpin' : 'Pin'} Message
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onBlock(message.userId, message.userName)}>
                  <Ban className="h-4 w-4 mr-2" />
                  Block User
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onMute(message.userId, message.userName)}>
                  <VolumeX className="h-4 w-4 mr-2" />
                  Mute User
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {message.fileUrl && (
          <div className="mb-2">
            {message.fileType?.startsWith('image/') ? (
              <img
                src={message.fileUrl}
                alt={message.fileName}
                className="max-w-full rounded"
              />
            ) : (
              <a
                href={message.fileUrl}
                download={message.fileName}
                className="flex items-center gap-2 p-2 bg-white/10 rounded"
              >
                <Paperclip className="h-4 w-4" />
                <span className="text-sm truncate">{message.fileName}</span>
              </a>
            )}
          </div>
        )}

        <p className="text-sm whitespace-pre-wrap break-words">{message.message}</p>

        <div className="flex items-center justify-between mt-1">
          <span className="text-xs opacity-70">
            {format(new Date(message.timestamp), 'HH:mm')}
          </span>
          {isOwnMessage && (
            <span className="text-xs opacity-70">
              {message.readBy.length > 1 ? (
                <CheckCheck className="h-3 w-3 inline" />
              ) : (
                <Check className="h-3 w-3 inline" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
