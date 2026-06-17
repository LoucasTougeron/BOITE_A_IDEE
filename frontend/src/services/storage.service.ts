import { supabase } from '../lib/supabase';

export const storageService = {
  async uploadProjectFile(file: File): Promise<string> {
    const ext = file.name.split('.').pop() || 'pdf';
    const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    const safeName = baseName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `${Date.now()}-${safeName}.${ext}`;

    const { error } = await supabase.storage.from('project_files').upload(fileName, file);
    if (error) throw error;

    const { data } = supabase.storage.from('project_files').getPublicUrl(fileName);
    return data.publicUrl;
  },

  async downloadProjectFile(fileUrl: string, projectTitle: string): Promise<void> {
    const urlParts = fileUrl.split('/');
    const rawFileName = urlParts[urlParts.length - 1].split('?')[0];

    let displayFileName = `${projectTitle || 'document'}.pdf`;
    if (rawFileName.includes('-')) {
      const parts = rawFileName.split('-');
      parts.shift();
      displayFileName = parts.join('-');
    }

    const { data: blob, error } = await supabase.storage.from('project_files').download(rawFileName);
    if (error) throw error;
    if (!blob) throw new Error('No blob returned');

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = displayFileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },
};
