import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Project, Client } from '../types';
import { ProjectModal } from '../components/ProjectModal';
import { safeFetchJson } from '../config/api';
import { FolderKanban, Plus, User, ArrowRight, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ProjectsPage: React.FC = () => {
  const { user, accessToken } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const canCreate = user?.role === 'ADMIN' || user?.role === 'PROJECT_MANAGER';

  const fetchData = async () => {
    if (!accessToken) return;
    try {
      const pData = await safeFetchJson('/api/projects', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (pData?.projects) setProjects(pData.projects);

      if (canCreate) {
        const cData = await safeFetchJson('/api/clients', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (cData?.clients) setClients(cData.clients);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [accessToken]);

  const handleCreateProject = async (projectData: { title: string; description?: string; clientId: string }) => {
    await safeFetchJson('/api/projects', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(projectData),
    });

    await fetchData();
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      await safeFetchJson(`/api/projects/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <FolderKanban className="w-5 h-5 text-indigo-400" />
            <span>Projects</span>
          </h1>
          <p className="text-xs text-slate-400">
            {user?.role === 'PROJECT_MANAGER'
              ? 'Projects created and managed by you'
              : 'All agency projects'}
          </p>
        </div>

        {canCreate && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-xs flex items-center space-x-2 hover:opacity-90 shadow-lg shadow-indigo-500/25 transition-all self-start"
          >
            <Plus className="w-4 h-4" />
            <span>Create Project</span>
          </button>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="p-12 text-center glass-card rounded-2xl border border-slate-800 text-slate-500">
          <FolderKanban className="w-8 h-8 mx-auto opacity-30 mb-2" />
          <p className="text-sm font-medium">No projects found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => {
            const taskCount = project.tasks?.length || 0;
            const doneCount = project.tasks?.filter((t) => t.status === 'DONE').length || 0;
            const progress = taskCount > 0 ? Math.round((doneCount / taskCount) * 100) : 0;

            return (
              <div
                key={project.id}
                className="glass-card p-5 rounded-2xl border border-slate-800 hover:border-indigo-500/40 transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300 font-semibold">
                      {project.client?.name || 'Client'}
                    </span>
                    {(user?.role === 'ADMIN' || (user?.role === 'PROJECT_MANAGER' && project.createdById === user.id)) && (
                      <button
                        onClick={() => handleDeleteProject(project.id)}
                        className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                        title="Delete project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-white leading-snug">{project.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{project.description}</p>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-800/80">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400 font-medium">Progress</span>
                      <span className="text-indigo-300 font-mono font-bold">{progress}% ({doneCount}/{taskCount})</span>
                    </div>
                    <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <div className="flex items-center space-x-1 text-slate-400 text-[11px]">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      <span>PM: {project.createdBy?.name}</span>
                    </div>

                    <Link
                      to={`/projects/${project.id}`}
                      className="text-xs text-indigo-400 font-semibold hover:text-indigo-300 flex items-center space-x-1"
                    >
                      <span>Open</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleCreateProject}
        clients={clients}
      />
    </div>
  );
};
