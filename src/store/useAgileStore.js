import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { INITIAL_USERS } from '../constants/initialUsers';
import { supabase } from '../lib/supabase';

const useAgileStore = create(
  persist(
    (set, get) => ({
      projects: [
        { id: 'proj-1', name: 'Agile Engine', methodology: 'Scrum', status: 'active' }
      ],
      activeProjectId: 'proj-1',
      epics: [
        { id: 'ep1', project_id: 'proj-1', title: 'Infraestrutura Core Engine', description: 'Setup inicial do motor de agilidade', status: 'active', priority_order: 0 }
      ],
      userStories: [
        { id: 'us1', project_id: 'proj-1', epic_id: 'ep1', title: 'Como usuário, quero um Dashboard visualmente atraente', priority_order: 1, story_points: 8, sprint_id: '1', status: 'done' },
        { id: 'us2', project_id: 'proj-1', epic_id: 'ep1', title: 'Como PO, quero gerenciar o Backlog via Drag-and-Drop', priority_order: 2, story_points: 5, sprint_id: '1', status: 'in_progress' }
      ],
      tasks: [
        { id: 't1', project_id: 'proj-1', story_id: 'us1', title: 'Implementar layout base com Tailwind v4', estimated_hours: 4, actual_hours: 5, status: 'done' },
        { id: 't2', project_id: 'proj-1', story_id: 'us2', title: 'Configurar dnd-kit no Backlog', estimated_hours: 6, actual_hours: 0, status: 'todo' }
      ],
      sprints: [
        { id: '1', project_id: 'proj-1', goal: 'Core Engine Release v1', start_date: '2026-04-01', end_date: '2026-04-15', status: 'active' }
      ],
      retro_items: [],
      daily_items: [],
      review_items: [],
      review_notes: '',
      darkMode: false,
      isAuthenticated: false,
      user: null,
      confirmed_users: [...INITIAL_USERS],
      pending_users: [],
      loading: false,

      initializeAuth: async () => {
        if (!supabase) return;

        // 1. Checar sessão inicial
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          const userProfile = profile || session.user;
          if (!profile || userProfile.allowed === false) {
             await supabase.auth.signOut();
             set({ isAuthenticated: false, user: null });
             return;
          }
          
          set({ isAuthenticated: true, user: userProfile });
        }

        // 2. Ouvir mudanças (login/logout/refresh)
        supabase.auth.onAuthStateChange(async (event, session) => {
          if (session?.user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
              
            const userProfile = profile || session.user;
            
            // Se o perfil não existe ou não está autorizado, desloga
            if (!profile || userProfile.allowed === false) {
               console.warn('⚠️ Acesso não autorizado ou perfil não encontrado. Deslogando...');
               await supabase.auth.signOut();
               set({ isAuthenticated: false, user: null });
               return;
            }
            
            set({ isAuthenticated: true, user: userProfile });
          } else {
            set({ isAuthenticated: false, user: null });
          }
        });
      },

      fetchData: async () => {
        if (!supabase) {
          console.warn('Supabase not connected. Using local state.');
          return;
        }
        set({ loading: true });
        
        try {
          // Carregamento resiliente: cada tabela é carregada individualmente
          const fetchTable = async (tableName) => {
            const { data, error } = await supabase.from(tableName).select('*');
            if (error) {
              console.error(`❌ Erro ao carregar tabela ${tableName}:`, error);
              return null;
            }
            return data;
          };

          const [
            projects, epics, stories, tasks, sprints, profiles, daily, retro, review
          ] = await Promise.all([
            fetchTable('projects'),
            fetchTable('epics'),
            fetchTable('user_stories'),
            fetchTable('tasks'),
            fetchTable('sprints'),
            fetchTable('profiles'),
            fetchTable('daily_items'),
            fetchTable('retro_items'),
            fetchTable('review_items')
          ]);

          let confirmed = get().confirmed_users;
          let pending = get().pending_users;
          if (profiles) {
             confirmed = profiles.filter(p => p.allowed !== false);
             pending = profiles.filter(p => p.allowed === false);
          }

          set((state) => ({
            projects: projects || state.projects,
            epics: epics || state.epics,
            userStories: stories || state.userStories,
            tasks: tasks || state.tasks,
            sprints: sprints || state.sprints,
            confirmed_users: confirmed,
            pending_users: pending,
            daily_items: daily || state.daily_items,
            retro_items: retro || state.retro_items,
            review_items: review || state.review_items,
            loading: false
          }));
          
          if (projects && projects.length > 0 && !get().activeProjectId) {
            set({ activeProjectId: projects[0].id });
          }
        } catch (error) {
          console.error('Critical error during fetchData:', error);
          set({ loading: false });
        }
      },


      addProject: async (project) => {
        const newId = `proj-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newProject = { 
          id: newId, 
          name: project.name, 
          methodology: project.methodology || 'Scrum',
          status: 'active', 
          created_at: new Date().toISOString() 
        };
        
        if (supabase) {
          const { error } = await supabase.from('projects').insert(newProject);
          if (error) console.error('Error adding project to Supabase:', error);
        }

        set((state) => ({
          projects: [...state.projects, newProject],
          activeProjectId: newId,
        }));

        // Criar sprint inicial
        const newSprintId = `sp-${Date.now()}`;
        const newSprint = { 
          id: newSprintId, 
          project_id: newId, 
          goal: `${project.name} Start`, 
          status: 'active',
          start_date: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString()
        };

        if (supabase) {
          const { error } = await supabase.from('sprints').insert(newSprint);
          if (error) console.error('❌ Erro ao salvar Sprint inicial no Supabase:', error);
          else console.log('✅ Sprint inicial sincronizada!');
        }

        set((state) => ({
          sprints: [...state.sprints, newSprint]
        }));
      },

      setActiveProject: (projectId) => set({ activeProjectId: projectId }),

      archiveProject: async (projectId) => {
        if (supabase) {
          const { error } = await supabase
            .from('projects')
            .update({ status: 'archived' })
            .eq('id', projectId);
          
          if (error) {
            console.error('Error archiving project in Supabase:', error);
            return;
          }
        }

        set((state) => {
          const updatedProjects = state.projects.map(p => p.id === projectId ? { ...p, status: 'archived' } : p);
          const nextActiveProject = updatedProjects.find(p => p.status === 'active');
          return {
            projects: updatedProjects,
            activeProjectId: state.activeProjectId === projectId ? (nextActiveProject?.id || null) : state.activeProjectId
          };
        });
      },

      addUserStory: async (story) => {
        const newStory = { 
          id: `us-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, 
          project_id: get().activeProjectId, 
          epic_id: story.epic_id,
          sprint_id: story.sprint_id || null,
          title: story.title,
          description: story.description || '',
          priority_order: story.priority_order || 0,
          story_points: story.story_points || 0,
          estimated_hours: story.estimated_hours || 0,
          due_date: story.due_date || null,
          assigned_to: story.assigned_to || null,
          status: story.status || 'backlog',
          created_at: new Date().toISOString() 
        };

        if (supabase) {
          const { error } = await supabase.from('user_stories').insert(newStory);
          if (error) {
            console.error('❌ Erro ao salvar História no Supabase:', error);
            alert(`Falha ao salvar no banco: ${error.message} (Código: ${error.code})`);
            return; // Bloqueia adição local se falhar no banco
          }
          console.log('✅ História salva com sucesso no Supabase!');
        }

        set((state) => ({
          userStories: [...state.userStories, newStory]
        }));
      },

      addTask: async (task) => {
        if (!supabase) {
          alert('Erro de Conexão: Supabase não detectado. A tarefa será apenas local.');
        }

        const assignedUser = get().confirmed_users.find(u => u.name === task.assigned_to);

        const newTask = { 
          id: `t-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, 
          project_id: get().activeProjectId, 
          story_id: task.story_id,
          title: task.title,
          description: task.description || '',
          estimated_hours: task.estimated_hours || 0,
          actual_hours: task.actual_hours || 0,
          remaining_hours: task.remaining_hours !== undefined ? task.remaining_hours : (task.estimated_hours || 0),
          burn_history: task.burn_history || {},
          due_date: task.due_date || null,
          story_points: task.story_points || 0,
          status: task.status || 'todo',
          assigned_to: task.assigned_to || null,
          assignee_id: assignedUser?.id || null,
          is_blocked: !!task.is_blocked,
          block_reason: task.block_reason || '',
          priority_order: get().tasks.filter(t => t.project_id === get().activeProjectId).length,
          created_at: new Date().toISOString() 
        };

        if (supabase) {
          const { error } = await supabase.from('tasks').insert(newTask);
          if (error) {
            console.error('❌ Erro ao criar Tarefa no Supabase:', error);
            alert(`Falha ao salvar tarefa no banco de dados: ${error.message}\nVerifique se o Épico/História foi criado corretamente.`);
            return; // Bloqueia adição local se falhar no banco (opcional, mas recomendado para debug)
          }
          console.log('✅ Tarefa sincronizada!');
        }

        set((state) => ({
          tasks: [...state.tasks, newTask]
        }));
      },

      updateTaskStatus: async (taskId, status) => {
        console.log(`🚀 Iniciando update da tarefa ${taskId} para status: ${status}`);
        
        if (!supabase) {
          console.warn('⚠️ Erro: Supabase não está conectado (supabase client is null).');
          alert('Erro de Conexão: O cliente Supabase não foi inicializado. Verifique suas credenciais no arquivo .env.');
          return;
        }

        const previousTasks = get().tasks;
        const targetTask = previousTasks.find(t => t.id === taskId);
        
        if (!targetTask) {
          console.error(`❌ Erro: Tarefa ${taskId} não encontrada no estado local.`);
          return;
        }

        // Regra de Responsabilidade Obrigatória
        if (!targetTask.assigned_to) {
          alert(`Operação bloqueada: A tarefa "${targetTask.title}" não possui responsável.`);
          return;
        }

        const now = new Date().toISOString();
        const updates = { status };

        // Se está saindo do 'todo' pela primeira vez, registra o início
        if (targetTask.status === 'todo' && status !== 'todo' && !targetTask.started_at) {
          updates.started_at = now;
        }

        // Se está indo para 'done', registra a conclusão e calcula horas reais
        if (status === 'done') {
          updates.completed_at = now;
          
          // Cálculo automático de actual_hours se tiver data de início
          const startTime = targetTask.started_at || updates.started_at;
          if (startTime) {
            const diffMs = new Date(now) - new Date(startTime);
            const diffHrs = Math.max(0.5, Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10); // Mínimo 0.5h, arredondado para 1 casa
            updates.actual_hours = diffHrs;
          }
        } else {
          updates.completed_at = null;
        }

        console.log('📡 Enviando para o Supabase...', updates);

        // Tenta update completo
        let { error, count } = await supabase
          .from('tasks')
          .update(updates, { count: 'exact' })
          .eq('id', taskId);
        
        // Fallback robusto para colunas que podem não existir no banco ainda
        if (error && (error.code === '42703' || error.message?.includes('column'))) {
          console.warn('⚠️ Algumas colunas (started_at/completed_at) podem não existir. Tentando apenas status e actual_hours...');
          const safeUpdates = { status };
          if (updates.actual_hours) safeUpdates.actual_hours = updates.actual_hours;
          
          const retry = await supabase.from('tasks').update(safeUpdates, { count: 'exact' }).eq('id', taskId);
          error = retry.error;
          count = retry.count;
        }

        if (error && (error.message?.includes('status') || error.code === '23514')) {
          console.error('❌ Erro de Restrição: O banco de dados não aceita o status:', status);
          alert(`Erro: O banco de dados não permite o status "${status}". Verifique se as restrições (CHECK constraints) foram atualizadas no Supabase.`);
          return;
        }

        if (error) {
          console.error('❌ Erro persistente no Supabase:', error);
          alert(`Não foi possível salvar no banco (Erro ${error.code}): ${error.message}`);
          return;
        }

        if (count === 0) {
          console.error(`❌ Erro de Identidade: O comando de salvar rodou, mas alterou 0 linhas. ID: ${taskId}`);
          
          // Verifica se o item realmente existe antes de sugerir remoção
          const { data: exists } = await supabase.from('tasks').select('id').eq('id', taskId).single();
          
          if (!exists) {
            if (window.confirm(`ERRO DE PERSISTÊNCIA: A tarefa "${targetTask.title}" não existe no banco de dados. \n\nDeseja removê-la localmente?`)) {
              set((state) => ({ tasks: state.tasks.filter(t => t.id !== taskId) }));
            }
          } else {
            alert(`ERRO DE PERMISSÃO: A tarefa existe no banco, mas você não tem permissão para alterá-la ou o status "${status}" é inválido para as regras do banco (CHECK constraints).`);
          }
          return;
        }
        
        console.log(`✅ Sucesso! ${count} linha(s) atualizada(s) no Supabase.`);

        set((state) => {
          const updatedTasks = state.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t);
          const storyId = targetTask.story_id;
          const storyTasks = updatedTasks.filter(t => t.story_id === storyId);
          const allDone = storyTasks.length > 0 && storyTasks.every(t => t.status === 'done');

          const updatedStories = state.userStories.map(s => {
            if (s.id === storyId) {
              const newStatus = allDone ? 'done' : (s.status === 'done' ? 'in_progress' : s.status);
              
              if (newStatus !== s.status && supabase) {
                // Sincroniza história no Supabase de forma assíncrona, mas com log de erro
                supabase.from('user_stories').update({ status: newStatus }).eq('id', storyId)
                  .then(({ error }) => {
                    if (error) console.error(`❌ Erro ao sincronizar História ${storyId}:`, error);
                    else console.log(`✅ História ${storyId} atualizada para ${newStatus}`);
                  });
              }
              return { ...s, status: newStatus };
            }
            return s;
          });

          return {
            tasks: updatedTasks,
            userStories: updatedStories
          };
        });
      },

      toggleTaskBlock: async (taskId, reason = '') => {
        const targetTask = get().tasks.find(t => t.id === taskId);
        if (!targetTask) return;

        const updates = { 
          is_blocked: !targetTask.is_blocked, 
          block_reason: reason 
        };

        if (supabase) {
          const { error } = await supabase.from('tasks').update(updates).eq('id', taskId);
          if (error) console.error('Error toggling task block in Supabase:', error);
        }

        set((state) => ({
          tasks: state.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t)
        }));
      },

      updateUserStory: async (storyId, updates) => {
        if (supabase) {
          const cleanUpdates = {
            title: updates.title,
            due_date: updates.due_date || null,
            estimated_hours: updates.estimated_hours || 0,
            story_points: updates.story_points || 0,
            assigned_to: updates.assigned_to || null
          };
          const { error } = await supabase.from('user_stories').update(cleanUpdates).eq('id', storyId);
          if (error) {
            console.error('❌ Erro ao atualizar User Story no Supabase:', error);
            alert(`Erro ao salvar: ${error.message}`);
          } else {
            console.log('✅ User Story atualizada com sucesso!');
          }
        }
        set((state) => ({
          userStories: state.userStories.map(s => s.id === storyId ? { ...s, ...updates } : s)
        }));
      },

      updateStoryStatus: async (storyId, status) => {
        if (supabase) {
          const { error } = await supabase.from('user_stories').update({ status }).eq('id', storyId);
          if (error) console.error('❌ Erro ao atualizar status da Story no Supabase:', error);
        }
        set((state) => ({
          userStories: state.userStories.map(s => s.id === storyId ? { ...s, status } : s)
        }));
      },

      setSprintGoal: (sprintId, goal) => set((state) => ({
        sprints: state.sprints.map(s => s.id === sprintId ? { ...s, goal } : s)
      })),

      addSprint: async (sprint) => {
        const newSprint = { 
          id: `sp-${Date.now()}`, 
          project_id: get().activeProjectId,
          goal: sprint.goal,
          start_date: sprint.start_date || null,
          end_date: sprint.end_date || null,
          status: sprint.status || 'todo',
          created_at: new Date().toISOString()
        };

        if (supabase) {
          const { error } = await supabase.from('sprints').insert(newSprint);
          if (error) {
            console.error('❌ Erro ao criar Sprint no Supabase:', error);
            return; // Bloqueia adição local se falhar no banco
          }
          console.log('✅ Sprint sincronizada!');
        }

        set((state) => ({
          sprints: [...state.sprints, newSprint]
        }));
      },

      updateSprint: async (sprintId, updates) => {
        if (supabase) {
          const { error } = await supabase.from('sprints').update(updates).eq('id', sprintId);
          if (error) console.error('Error updating sprint in Supabase:', error);
        }
        set((state) => ({
          sprints: state.sprints.map(s => s.id === sprintId ? { ...s, ...updates } : s)
        }));
      },

      updateTask: async (taskId, updates) => {
        const assignedUser = get().confirmed_users.find(u => u.name === updates.assigned_to);
        const existingTask = get().tasks.find(t => t.id === taskId);
        
        let newBurnHistory = existingTask?.burn_history || {};
        if (updates.remaining_hours !== undefined && updates.remaining_hours !== existingTask?.remaining_hours) {
           const todayStr = new Date().toISOString().split('T')[0];
           newBurnHistory = { ...newBurnHistory, [todayStr]: updates.remaining_hours };
        }

        const cleanUpdates = {
          title: updates.title,
          description: updates.description || '',
          estimated_hours: updates.estimated_hours || 0,
          actual_hours: updates.actual_hours || 0,
          remaining_hours: updates.remaining_hours !== undefined ? updates.remaining_hours : (existingTask?.remaining_hours ?? updates.estimated_hours ?? 0),
          burn_history: newBurnHistory,
          due_date: updates.due_date || null,
          story_points: updates.story_points || 0,
          status: updates.status || 'todo',
          assigned_to: updates.assigned_to || null,
          assignee_id: assignedUser?.id || null,
          is_blocked: !!updates.is_blocked,
          block_reason: updates.block_reason || ''
        };

        if (supabase) {
          const { error } = await supabase.from('tasks').update(cleanUpdates).eq('id', taskId);
          if (error) console.error('❌ Erro ao atualizar Tarefa no Supabase:', error);
          else console.log('✅ Tarefa atualizada com sucesso!');
        }

        set((state) => ({
          tasks: state.tasks.map(t => t.id === taskId ? { ...t, ...cleanUpdates } : t)
        }));
      },

      addRetroItem: async (item) => {
        const newId = `retro-${Date.now()}`;
        const newItem = { 
          id: newId, 
          project_id: get().activeProjectId,
          category: item.category, // Usando o nome correto da coluna no banco
          content: item.content,
          votes: 0,
          created_at: new Date().toISOString() 
        };

        if (supabase) {
          const { error } = await supabase.from('retro_items').insert(newItem);
          if (error) {
            console.error('Error adding retro item to Supabase:', error);
            alert(`Erro ao salvar no banco: ${error.message}`);
            return;
          }
        }

        set((state) => ({
          retro_items: [...state.retro_items, newItem]
        }));
      },

      setReviewNotes: (notes) => set({ review_notes: notes }),

      assignEpicToSprint: (epicId, sprintId) => set((state) => ({
        userStories: state.userStories.map(s => 
          s.epic_id === epicId 
            ? { ...s, sprint_id: sprintId, status: 'todo' } 
            : s
        )
      })),

      assignStoryToSprint: async (storyId, sprintId) => {
        const state = get();
        const targetStory = state.userStories.find(s => s.id === storyId);
        if (!targetStory) return;

        let effectiveSprintId = sprintId || 
          state.sprints.find(s => s.status === 'active' && s.project_id === targetStory.project_id)?.id || 
          state.sprints.find(s => s.project_id === targetStory.project_id)?.id;

        let newSprints = [...state.sprints];
        
        // Se ainda não houver sprint, cria uma automaticamente
        if (!effectiveSprintId) {
          const newSprintId = `sp-${Date.now()}`;
          const newSprint = {
            id: newSprintId,
            project_id: targetStory.project_id,
            goal: 'Sprint Inicial',
            status: 'active',
            start_date: new Date().toISOString().split('T')[0],
            end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            created_at: new Date().toISOString()
          };
          
          if (supabase) {
            const { error } = await supabase.from('sprints').insert(newSprint);
            if (error) console.error('Error creating auto-sprint:', error);
          }
          
          newSprints.push(newSprint);
          effectiveSprintId = newSprintId;
        }

        const updates = { sprint_id: effectiveSprintId, status: 'todo' };
        
        if (supabase) {
          const { error } = await supabase.from('user_stories').update(updates).eq('id', storyId);
          if (error) console.error('Error assigning story to sprint in Supabase:', error);
        }

        set((state) => ({
          sprints: newSprints,
          userStories: state.userStories.map(s => 
            s.id === storyId ? { ...s, ...updates } : s
          )
        }));
      },

      addDailyItem: async (item) => {
        const newId = `daily-${Date.now()}`;
        const newItem = { 
          id: newId, 
          project_id: get().activeProjectId, 
          task_id: item.task_id || null,
          type: item.type, // 'action' ou 'impediment'
          content: item.content,
          created_at: new Date().toISOString()
        };

        if (supabase) {
          const { error } = await supabase.from('daily_items').insert(newItem);
          if (error) {
            console.error('❌ Erro ao criar Daily Item no Supabase:', error);
            alert(`Falha ao salvar item da Daily no banco: ${error.message}\nVerifique se as colunas 'type', 'content' e 'task_id' existem na tabela 'daily_items'.`);
            return; // Bloqueia adição local se falhar no banco
          }
        }

        set((state) => ({
          daily_items: [...state.daily_items, newItem]
        }));
      },

      addReviewItem: async (item) => {
        const newId = `rev-${Date.now()}`;
        const newItem = { 
          id: newId, 
          project_id: get().activeProjectId, 
          title: item.title,
          note: item.note || '',
          created_at: new Date().toISOString() 
        };

        if (supabase) {
          const { error } = await supabase.from('review_items').insert(newItem);
          if (error) console.error('Error adding review item to Supabase:', error);
        }

        set((state) => ({
          review_items: [...state.review_items, newItem]
        }));
      },

      deleteReviewItem: (itemId) => set((state) => ({
        review_items: state.review_items.filter(item => item.id !== itemId)
      })),

      deleteDailyItem: async (itemId) => {
        if (supabase) {
          const { error } = await supabase.from('daily_items').delete().eq('id', itemId);
          if (error) console.error('Error deleting daily item from Supabase:', error);
        }
        set((state) => ({
          daily_items: state.daily_items.filter(item => item.id !== itemId)
        }));
      },

      deleteRetroItem: async (itemId) => {
        if (supabase) {
          const { error } = await supabase.from('retro_items').delete().eq('id', itemId);
          if (error) {
            console.error('Error deleting retro item from Supabase:', error);
            alert(`Erro ao excluir do banco: ${error.message}`);
            return;
          }
        }
        set((state) => ({
          retro_items: state.retro_items.filter(item => item.id !== itemId)
        }));
      },

      rejectTask: (taskId, reason) => set((state) => {
        const task = state.tasks.find(t => t.id === taskId);
        if (!task) return state;

        const updatedTasks = state.tasks.map(t => 
          t.id === taskId ? { 
            ...t, 
            status: 'todo', 
            is_blocked: true, 
            block_reason: `Reprovado na Review: ${reason}`,
            rejection_history: [...(t.rejection_history || []), { reason, date: new Date().toISOString() }]
          } : t
        );

        // If the parent story was 'done', set it back to 'in_progress'
        const updatedStories = state.userStories.map(s => 
          s.id === task.story_id && s.status === 'done'
            ? { ...s, status: 'in_progress' }
            : s
        );

        return { tasks: updatedTasks, userStories: updatedStories };
      }),

      deleteTask: async (taskId) => {
        if (supabase) {
          const { error } = await supabase.from('tasks').delete().eq('id', taskId);
          if (error) console.error('❌ Erro ao excluir Tarefa no Supabase:', error);
        }
        set((state) => ({
          tasks: state.tasks.filter(task => task.id !== taskId)
        }));
      },

      deleteStory: async (storyId) => {
        if (supabase) {
          const { error } = await supabase.from('user_stories').delete().eq('id', storyId);
          if (error) console.error('❌ Erro ao excluir User Story no Supabase:', error);
        }
        set((state) => ({
          userStories: state.userStories.filter(story => story.id !== storyId),
          tasks: state.tasks.filter(task => task.story_id !== storyId)
        }));
      },

      returnStoryToBacklog: async (storyId, justification) => {
        const updates = { sprint_id: null, status: 'backlog', backlog_justification: justification };
        if (supabase) {
          await supabase.from('user_stories').update(updates).eq('id', storyId);
        }
        set((state) => ({
          userStories: state.userStories.map(s => 
            s.id === storyId 
              ? { ...s, ...updates } 
              : s
          )
        }));
      },

      reorderStories: async (storyId, direction) => {
        const state = get();
        const projectStories = state.userStories
          .filter(s => s.project_id === state.activeProjectId)
          .sort((a, b) => (a.priority_order || 0) - (b.priority_order || 0));
        
        const index = projectStories.findIndex(s => s.id === storyId);
        if (index === -1) return;

        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= projectStories.length) return;

        const currentStory = projectStories[index];
        const targetStory = projectStories[targetIndex];

        const currentOrder = currentStory.priority_order || 0;
        const targetOrder = targetStory.priority_order || 0;

        if (supabase) {
          await Promise.all([
            supabase.from('user_stories').update({ priority_order: targetOrder }).eq('id', currentStory.id),
            supabase.from('user_stories').update({ priority_order: currentOrder }).eq('id', targetStory.id)
          ]);
        }

        set((state) => ({
          userStories: state.userStories.map(s => {
            if (s.id === currentStory.id) return { ...s, priority_order: targetOrder };
            if (s.id === targetStory.id) return { ...s, priority_order: currentOrder };
            return s;
          })
        }));
      },

      login: async (email, password) => {
        if (!supabase) return { success: false, message: 'Supabase não conectado.' };
        
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          // Fallback para INITIAL_USERS (Desenvolvimento)
          const initialUser = INITIAL_USERS.find(u => u.email === email && u.password === password);
          if (initialUser) {
            if (initialUser.allowed === false) {
               return { success: false, message: 'Acesso bloqueado. Aguarde liberação do gestor.' };
            }
            console.log('✅ Login via INITIAL_USERS (Fallback)');
            set({ isAuthenticated: true, user: initialUser });
            return { success: true };
          }
          return { success: false, message: 'E-mail ou senha incorretos.' };
        }


        // Buscar perfil complementar
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        const userProfile = profile || data.user;
        
        if (userProfile.allowed === false) {
           await supabase.auth.signOut();
           return { success: false, message: 'Acesso bloqueado. Aguarde liberação do gestor.' };
        }

        set({ isAuthenticated: true, user: userProfile });
        return { success: true };
      },

      logout: async () => {
        if (supabase) await supabase.auth.signOut();
        set({ isAuthenticated: false, user: null });
      },

      register: async (userData) => {
        if (!supabase) return false;

        const { data, error } = await supabase.auth.signUp({
          email: userData.email,
          password: userData.password,
          options: {
            data: {
              name: userData.name,
            }
          }
        });

        if (error) {
          console.error('Erro no registro:', error.message);
          return false;
        }

        if (data?.user) {
          await supabase.from('profiles').insert({
             id: data.user.id,
             name: userData.name,
             email: userData.email,
             role: 'Usuario',
             allowed: false
          });
          
          // Importante: Deslogar imediatamente após o cadastro
          // O Supabase loga automaticamente no signUp, mas queremos aprovação manual
          await supabase.auth.signOut();
        }

        return true;
      },

      approveUser: async (userId) => {
        if (supabase) {
           const { error } = await supabase.from('profiles').update({ allowed: true }).eq('id', userId);
           if (error) {
              console.error('Erro ao aprovar usuário:', error.message);
              return;
           }
        }
        
        set((state) => {
          const userToApprove = state.pending_users.find(u => u.id === userId);
          if (!userToApprove) return state;

          return {
            pending_users: state.pending_users.filter(u => u.id !== userId),
            confirmed_users: [...state.confirmed_users, { ...userToApprove, allowed: true }]
          };
        });
      },

      rejectUser: async (userId) => {
        if (supabase) {
           const { error } = await supabase.from('profiles').delete().eq('id', userId);
           if (error) {
              console.error('Erro ao rejeitar usuário:', error.message);
              return;
           }
        }

        set((state) => ({
          pending_users: state.pending_users.filter(u => u.id !== userId)
        }));
      },

      addEpic: async (epicData) => {
        const state = get();
        const nextOrder = state.epics.length > 0 ? Math.max(...state.epics.map(e => e.priority_order || 0)) + 1 : 0;
        const newEpic = { 
          id: `e-${Date.now()}`, 
          project_id: state.activeProjectId,
          title: epicData.title,
          description: epicData.description || '',
          status: epicData.status || 'planned',
          priority_order: nextOrder,
          created_at: new Date().toISOString() 
        };

        if (supabase) {
          const { error } = await supabase.from('epics').insert(newEpic);
          if (error) {
            console.error('❌ Erro ao salvar Épico no Supabase:', error);
            alert(`Falha ao salvar Épico: ${error.message}`);
            return; // Bloqueia adição local se falhar no banco
          }
        }

        set((state) => ({
          epics: [...state.epics, newEpic]
        }));
      },

      reorderEpics: async (epicId, direction) => {
        const state = get();
        const activeProjectId = state.activeProjectId;
        
        // 1. Pegar épicos do projeto e garantir uma ordenação base consistente (normalização)
        let projectEpics = [...state.epics]
          .filter(e => e.project_id === activeProjectId)
          .sort((a, b) => {
            if ((a.priority_order || 0) !== (b.priority_order || 0)) {
              return (a.priority_order || 0) - (b.priority_order || 0);
            }
            return a.id.localeCompare(b.id); // Desempate por ID
          });

        // 2. Reatribuir ordens sequenciais para evitar duplicatas (0, 1, 2...)
        projectEpics = projectEpics.map((epic, i) => ({ ...epic, priority_order: i }));
          
        const index = projectEpics.findIndex(e => e.id === epicId);
        if (index === -1) return;
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === projectEpics.length - 1) return;

        const newIndex = direction === 'up' ? index - 1 : index + 1;
        
        // 3. Swap simples nos índices do array
        const temp = projectEpics[index];
        projectEpics[index] = projectEpics[newIndex];
        projectEpics[newIndex] = temp;

        // 4. Recalcular priority_order baseado na nova posição no array
        const updatedEpics = projectEpics.map((epic, i) => ({ ...epic, priority_order: i }));

        // 5. Sincronizar com o Supabase (Lote)
        if (supabase) {
          // Atualiza todos os épicos afetados para garantir integridade total
          const updates = updatedEpics.map(epic => 
            supabase.from('epics').update({ priority_order: epic.priority_order }).eq('id', epic.id)
          );
          await Promise.all(updates);
        }

        // 6. Atualizar estado local mantendo os outros épicos de outros projetos intocados
        set((state) => {
          const others = state.epics.filter(e => e.project_id !== activeProjectId);
          return { epics: [...others, ...updatedEpics] };
        });
      },

      reorderTasks: async (taskId, direction) => {
        const state = get();
        const activeProjectId = state.activeProjectId;
        
        let projectTasks = [...state.tasks]
          .filter(t => t.project_id === activeProjectId)
          .sort((a, b) => {
            if ((a.priority_order || 0) !== (b.priority_order || 0)) {
              return (a.priority_order || 0) - (b.priority_order || 0);
            }
            return a.id.localeCompare(b.id);
          });

        projectTasks = projectTasks.map((task, i) => ({ ...task, priority_order: i }));
          
        const index = projectTasks.findIndex(t => t.id === taskId);
        if (index === -1) return;
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === projectTasks.length - 1) return;

        const newIndex = direction === 'up' ? index - 1 : index + 1;
        
        const temp = projectTasks[index];
        projectTasks[index] = projectTasks[newIndex];
        projectTasks[newIndex] = temp;

        const updatedTasks = projectTasks.map((task, i) => ({ ...task, priority_order: i }));

        if (supabase) {
          const updates = updatedTasks.map(task => 
            supabase.from('tasks').update({ priority_order: task.priority_order }).eq('id', task.id)
          );
          await Promise.all(updates);
        }

        set((state) => {
          const others = state.tasks.filter(t => t.project_id !== activeProjectId);
          return { tasks: [...others, ...updatedTasks] };
        });
      },

      addUser: async (userData) => {
        const newUser = { 
          ...userData, 
          id: `u-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, 
          allowed: true,
          created_at: new Date().toISOString() 
        };

        if (supabase) {
          const profile = {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            access: newUser.role === 'Gestor' || newUser.role === 'Gerente' ? 'Gestor' : 'Colaborador'
          };
          const { error } = await supabase.from('profiles').insert(profile);
          if (error) console.error('Error adding user profile to Supabase:', error);
        }

        set((state) => ({
          confirmed_users: [...state.confirmed_users, newUser]
        }));
      },

      updateUser: async (userId, data) => {
        if (supabase) {
          const { error } = await supabase
            .from('profiles')
            .update({
              name: data.name,
              email: data.email,
              role: data.role,
              daily_hours: data.daily_hours,
              access: data.role === 'Gestor' || data.role === 'Gerente' ? 'Gestor' : 'Colaborador'
            })
            .eq('id', userId);
          if (error) console.error('Error updating profile in Supabase:', error);
        }

        set((state) => ({
          confirmed_users: state.confirmed_users.map(u => 
            u.id === userId ? { ...u, ...data } : u
          ),
          user: state.user?.id === userId ? { ...state.user, ...data } : state.user
        }));
      },

      deleteUser: async (userId) => {
        if (supabase) {
          const { error } = await supabase
            .from('profiles')
            .delete()
            .eq('id', userId);
          if (error) console.error('Error deleting profile from Supabase:', error);
        }

        set((state) => ({
          confirmed_users: state.confirmed_users.filter(u => u.id !== userId)
        }));
      },

      updateUserHours: async (userId, hours) => {
        if (supabase) {
          const { error } = await supabase
            .from('profiles')
            .update({ daily_hours: hours })
            .eq('id', userId);
          if (error) console.error('Error updating user hours in Supabase:', error);
        }
        
        set((state) => ({
          confirmed_users: state.confirmed_users.map(u => 
            u.id === userId ? { ...u, daily_hours: hours } : u
          )
        }));
      },

      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),

    }),
    { 
      name: 'agile-engine-storage',
      version: 2, // Bumped version to force refresh of ordering logic
    }
  )
);

export default useAgileStore;
