import { create } from 'zustand';
import type { ChatMessage } from '@/types';
import {
  getChatMessages,
  saveChatMessage,
  clearChatHistory,
  getProfile,
  getUpcomingEvents,
  getTodayWorkouts,
  getWeekWorkouts,
  getRecentWorkouts,
  getRecentMoodEntries,
  getBenchmarks,
  updateWorkoutDetails,
  updateProfile,
} from '@/storage/repository';
import { streamMessage } from '@/services/claude';
import { buildChatSystemPrompt } from '@/services/prompts';
import { parsePlanUpdate } from '@/services/planGenerator';
import { getTodayISO, getWeekStartISO } from '@/utils/date';

interface ChatStore {
  messages: ChatMessage[];
  isStreaming: boolean;
  streamingText: string;
  error: string | null;

  loadMessages: (pid: string) => void;
  sendMessage: (pid: string, content: string) => Promise<void>;
  clearChat: (pid: string) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  isStreaming: false,
  streamingText: '',
  error: null,

  loadMessages: (pid) => {
    const msgs = getChatMessages(pid, 50);
    set({ messages: msgs });
  },

  sendMessage: async (pid, content) => {
    saveChatMessage(pid, 'user', content);
    const messages = getChatMessages(pid, 50);
    set({ messages, isStreaming: true, streamingText: '', error: null });

    try {
      const profile = getProfile(pid);
      const events = getUpcomingEvents(pid);
      const todayWorkouts = getTodayWorkouts(pid, getTodayISO());
      const weekWorkouts = getWeekWorkouts(pid, getWeekStartISO());
      const recentWorkouts = getRecentWorkouts(pid);
      const recentMood = getRecentMoodEntries(pid, 14);
      const benchmarks = getBenchmarks(pid);

      const systemPrompt = buildChatSystemPrompt(
        profile,
        todayWorkouts,
        weekWorkouts,
        events,
        recentWorkouts,
        recentMood,
        benchmarks
      );

      const apiMessages = messages.slice(-20).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      let fullResponse = '';

      await streamMessage(
        systemPrompt,
        apiMessages,
        (text) => {
          fullResponse += text;
          set({ streamingText: fullResponse });
        },
        () => {
          saveChatMessage(pid, 'assistant', fullResponse);

          const planUpdate = parsePlanUpdate(fullResponse);
          if (planUpdate) {
            try {
              if (planUpdate.action === 'update_equipment' && planUpdate.changes.equipment) {
                updateProfile(pid, {
                  equipment: JSON.stringify(planUpdate.changes.equipment),
                });
              } else if (planUpdate.workoutId && planUpdate.changes) {
                updateWorkoutDetails(pid, planUpdate.workoutId, planUpdate.changes as Record<string, string | number>);
              }
            } catch {
              // Plan update parsing failed, not critical
            }
          }

          const updatedMsgs = getChatMessages(pid, 50);
          set({ messages: updatedMsgs, isStreaming: false, streamingText: '' });
        },
        (error) => {
          set({ isStreaming: false, streamingText: '', error: error.message });
        }
      );
    } catch (error) {
      set({
        isStreaming: false,
        streamingText: '',
        error: error instanceof Error ? error.message : 'Chat failed',
      });
    }
  },

  clearChat: (pid) => {
    clearChatHistory(pid);
    set({ messages: [], streamingText: '' });
  },
}));
