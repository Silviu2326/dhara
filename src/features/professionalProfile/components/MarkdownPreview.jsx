import React from 'react';

export const MarkdownPreview = ({ content }) => {
  if (!content) {
    return null;
  }

  // Función simple para convertir Markdown básico a HTML
  const parseMarkdown = (text) => {
    let html = text;
    
    // Encabezados
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold text-deep mb-2 mt-4">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold text-deep mb-3 mt-4">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-deep mb-3 mt-4">$1</h1>');
    
    // Negrita
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>');
    
    // Cursiva
    html = html.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
    
    // Enlaces
    html = html.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2" class="text-sage hover:text-sage/80 underline" target="_blank" rel="noopener noreferrer">$1</a>');
    
    // Listas
    const lines = html.split('\n');
    let inList = false;
    const processedLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const isListItem = line.trim().startsWith('- ');
      
      if (isListItem && !inList) {
        processedLines.push('<ul class="list-disc list-inside space-y-1 my-2">');
        inList = true;
      } else if (!isListItem && inList) {
        processedLines.push('</ul>');
        inList = false;
      }
      
      if (isListItem) {
        const itemText = line.trim().substring(2);
        processedLines.push(`<li class="text-gray-700">${itemText}</li>`);
      } else {
        processedLines.push(line);
      }
    }
    
    if (inList) {
      processedLines.push('</ul>');
    }
    
    html = processedLines.join('\n');
    
    // Párrafos
    html = html.replace(/\n\n/g, '</p><p class="mb-3 text-gray-700 leading-relaxed">');
    html = '<p class="mb-3 text-gray-700 leading-relaxed">' + html + '</p>';
    
    // Limpiar párrafos vacíos
    html = html.replace(/<p class="mb-3 text-gray-700 leading-relaxed">\s*<\/p>/g, '');
    
    // Saltos de línea simples
    html = html.replace(/\n/g, '<br />');
    
    return html;
  };

  const htmlContent = parseMarkdown(content);

  return (
    <div 
      className="prose prose-sm max-w-none"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};