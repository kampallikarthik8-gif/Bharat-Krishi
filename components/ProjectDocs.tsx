import React from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PROJECT_DOCS_DATA, DocPage } from './projectDocsData';
import { 
  BookOpen, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Printer, 
  Download, 
  Copy, 
  Bookmark, 
  BookmarkCheck, 
  List, 
  Check, 
  FileText,
  Sparkles,
  Layers,
  Cpu,
  Database,
  ShieldCheck,
  Code,
  FileDown,
  Loader2
} from 'lucide-react';
import { triggerHaptic, triggerSelectionHaptic } from '../src/utils/haptics';

export const ProjectDocs: React.FC = () => {
  const [currentPage, setCurrentPage] = React.useState<number>(1);
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  const [selectedCategory, setSelectedCategory] = React.useState<string>('All');
  const [isGeneratingPdf, setIsGeneratingPdf] = React.useState<boolean>(false);
  const [bookmarks, setBookmarks] = React.useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('agri_doc_bookmarks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showTocDrawer, setShowTocDrawer] = React.useState<boolean>(false);
  const [copied, setCopied] = React.useState<boolean>(false);

  const activeDoc = PROJECT_DOCS_DATA.find(d => d.pageNumber === currentPage) || PROJECT_DOCS_DATA[0];

  const handlePageChange = (pageNum: number) => {
    if (pageNum >= 1 && pageNum <= PROJECT_DOCS_DATA.length) {
      triggerSelectionHaptic();
      setCurrentPage(pageNum);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const toggleBookmark = (pageNum: number) => {
    triggerHaptic();
    setBookmarks(prev => {
      const exists = prev.includes(pageNum);
      const next = exists ? prev.filter(p => p !== pageNum) : [...prev, pageNum];
      try {
        localStorage.setItem('agri_doc_bookmarks', JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  const handleCopyPage = () => {
    triggerHaptic();
    const text = `# ${activeDoc.chapter}: ${activeDoc.title}\n${activeDoc.subtitle}\n\nCategory: ${activeDoc.category}\n\n${activeDoc.summary}\n\n` + 
      activeDoc.content.sections.map(s => `## ${s.heading}\n${s.body || ''}\n${s.bullets ? s.bullets.map(b => `- ${b}`).join('\n') : ''}\n${s.codeBlock ? `\`\`\`${s.codeBlock.language}\n${s.codeBlock.code}\n\`\`\`` : ''}`).join('\n\n');
    
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrintFullDocument = () => {
    triggerHaptic();
    window.print();
  };

  const handleExportPdf = async () => {
    triggerHaptic();
    setIsGeneratingPdf(true);

    try {
      // Small timeout to allow UI loading spinner to render
      await new Promise(resolve => setTimeout(resolve, 100));

      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 14;
      const contentWidth = pageWidth - (margin * 2);

      PROJECT_DOCS_DATA.forEach((docData, index) => {
        if (index > 0) {
          pdf.addPage();
        }

        let y = margin;

        // Header Bar
        pdf.setFillColor(24, 24, 27); // Dark background
        pdf.rect(margin, y, contentWidth, 12, 'F');
        
        pdf.setTextColor(245, 158, 11); // Amber
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.text(`BHARATKISANSMART SPECIFICATION • PAGE ${docData.pageNumber} OF 30`, margin + 4, y + 8);

        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(8);
        pdf.text(docData.chapter, pageWidth - margin - 4, y + 8, { align: 'right' });

        y += 18;

        // Document Title
        pdf.setTextColor(15, 23, 42); // Dark slate
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(16);
        const titleLines = pdf.splitTextToSize(docData.title, contentWidth);
        pdf.text(titleLines, margin, y);
        y += (titleLines.length * 7) + 2;

        // Subtitle & Category
        pdf.setFont('helvetica', 'italic');
        pdf.setFontSize(9);
        pdf.setTextColor(100, 116, 139);
        const subtitleLines = pdf.splitTextToSize(`${docData.subtitle} | Category: ${docData.category}`, contentWidth);
        pdf.text(subtitleLines, margin, y);
        y += (subtitleLines.length * 5) + 6;

        // Summary Box
        pdf.setFillColor(248, 250, 252);
        pdf.setDrawColor(226, 232, 240);
        pdf.rect(margin, y, contentWidth, 18, 'FD');

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8);
        pdf.setTextColor(217, 119, 6);
        pdf.text('CHAPTER ABSTRACT:', margin + 4, y + 5);

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.setTextColor(51, 65, 85);
        const summaryLines = pdf.splitTextToSize(docData.summary, contentWidth - 8);
        pdf.text(summaryLines, margin + 4, y + 10);

        y += 24;

        // Sections
        docData.content.sections.forEach(sec => {
          if (y > pageHeight - 30) {
            return; // Prevent extreme overflow
          }

          // Section Heading
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(11);
          pdf.setTextColor(15, 23, 42);
          pdf.text(sec.heading, margin, y);
          y += 6;

          // Section Body
          if (sec.body) {
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(8.5);
            pdf.setTextColor(51, 65, 85);
            const bodyLines = pdf.splitTextToSize(sec.body, contentWidth);
            pdf.text(bodyLines, margin, y);
            y += (bodyLines.length * 4.5) + 3;
          }

          // Bullets
          if (sec.bullets && sec.bullets.length > 0) {
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(8);
            pdf.setTextColor(30, 41, 59);
            sec.bullets.forEach(b => {
              if (y < pageHeight - 25) {
                const bulletLines = pdf.splitTextToSize(`• ${b}`, contentWidth - 4);
                pdf.text(bulletLines, margin + 3, y);
                y += (bulletLines.length * 4) + 1;
              }
            });
            y += 2;
          }

          // Table via autoTable
          if (sec.table && sec.table.headers) {
            autoTable(pdf, {
              startY: y,
              margin: { left: margin, right: margin },
              head: [sec.table.headers],
              body: sec.table.rows,
              theme: 'striped',
              headStyles: { fillColor: [24, 24, 27], textColor: [245, 158, 11], fontSize: 8, fontStyle: 'bold' },
              bodyStyles: { fontSize: 7.5, textColor: [51, 65, 85] },
              styles: { cellPadding: 2, overflow: 'linebreak' },
              didDrawPage: (data) => {
                if (data.cursor) {
                  y = data.cursor.y + 4;
                }
              }
            });
            y += 4;
          }

          // Code Block
          if (sec.codeBlock) {
            pdf.setFillColor(15, 23, 42);
            const codeLines = pdf.splitTextToSize(sec.codeBlock.code, contentWidth - 8);
            const codeBoxHeight = Math.min(codeLines.length * 3.5 + 6, 40);
            
            pdf.rect(margin, y, contentWidth, codeBoxHeight, 'F');
            pdf.setFont('courier', 'normal');
            pdf.setFontSize(7);
            pdf.setTextColor(52, 211, 153); // Emerald code text
            pdf.text(codeLines.slice(0, 10), margin + 4, y + 5);
            y += codeBoxHeight + 4;
          }

          y += 2;
        });

        // Footer Bar on every page
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7);
        pdf.setTextColor(148, 163, 184);
        pdf.text('BharatKisanSmart Architectural Blueprint & System Requirements', margin, pageHeight - 8);
        pdf.text(`Page ${docData.pageNumber} of 30`, pageWidth - margin, pageHeight - 8, { align: 'right' });
      });

      pdf.save('BharatKisanSmart_30_Page_Project_Specification.pdf');
    } catch (err) {
      console.error('Error generating PDF:', err);
      // Fallback to window.print() if jsPDF encounters any issue
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleExportMarkdown = () => {
    triggerHaptic();
    const fullMarkdown = PROJECT_DOCS_DATA.map(doc => {
      return `# Page ${doc.pageNumber}: ${doc.chapter} - ${doc.title}\n*${doc.subtitle}*\nCategory: ${doc.category}\n\n> ${doc.summary}\n\n` + 
        doc.content.sections.map(s => {
          let sectionStr = `### ${s.heading}\n\n${s.body || ''}\n`;
          if (s.bullets) {
            sectionStr += '\n' + s.bullets.map(b => `- ${b}`).join('\n') + '\n';
          }
          if (s.table) {
            sectionStr += '\n| ' + s.table.headers.join(' | ') + ' |\n';
            sectionStr += '| ' + s.table.headers.map(() => '---').join(' | ') + ' |\n';
            sectionStr += s.table.rows.map(row => '| ' + row.join(' | ') + ' |').join('\n') + '\n';
          }
          if (s.codeBlock) {
            sectionStr += `\n\`\`\`${s.codeBlock.language}\n${s.codeBlock.code}\n\`\`\`\n`;
          }
          return sectionStr;
        }).join('\n\n---\n\n');
    }).join('\n\n=========================================\n\n');

    const blob = new Blob([fullMarkdown], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'BharatKisanSmart_30_Page_Project_Docs.md');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredDocs = PROJECT_DOCS_DATA.filter(doc => {
    const matchesCategory = selectedCategory === 'All' || doc.category === selectedCategory;
    const matchesQuery = searchQuery.trim() === '' || 
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.chapter.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.pageNumber.toString() === searchQuery.trim();
    return matchesCategory && matchesQuery;
  });

  const categories = ['All', 'Overview', 'Architecture', 'SRS', 'AI Modules', 'Agronomy Engine', 'Data & Storage', 'Operations & Roadmap'];

  return (
    <div className="w-full min-h-screen bg-black text-stone-200 pb-32">
      
      {/* Printable Area Styles */}
      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          header, nav, .no-print { display: none !important; }
          .print-container { display: block !important; width: 100% !important; padding: 0 !important; }
          .page-break { page-break-after: always; break-after: page; margin-top: 2rem; }
          .print-card { border: 1px solid #ccc !important; background: white !important; color: black !important; }
        }
      `}</style>

      {/* Top Header / Action Bar */}
      <div className="no-print bg-stone-950 border-b border-amber-500/10 sticky top-0 z-30 px-4 py-4 backdrop-blur-md bg-opacity-90">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-4 items-center justify-between">
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest bg-amber-500/10 px-2 py-0.5 rounded">
                  System Specification
                </span>
                <span className="text-[10px] text-stone-500 font-mono">30 Pages Complete</span>
              </div>
              <h1 className="text-lg font-black text-white tracking-tight">Project Documentation Hub</h1>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto no-scrollbar">
            <button
              onClick={() => setShowTocDrawer(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-xs font-bold text-stone-300 hover:text-white transition-all whitespace-nowrap"
            >
              <List className="w-4 h-4 text-amber-500" />
              <span>Chapters ({currentPage}/30)</span>
            </button>

            <button
              onClick={handleCopyPage}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-xs font-bold text-stone-300 hover:text-white transition-all whitespace-nowrap"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-stone-400" />}
              <span>{copied ? 'Copied!' : 'Copy Page'}</span>
            </button>

            <button
              onClick={handleExportMarkdown}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-500 hover:bg-amber-500/20 transition-all whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              <span>Export .MD</span>
            </button>

            <button
              onClick={handleExportPdf}
              disabled={isGeneratingPdf}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-xs font-bold text-emerald-400 hover:bg-emerald-500/30 transition-all whitespace-nowrap disabled:opacity-50"
            >
              {isGeneratingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
              ) : (
                <FileDown className="w-4 h-4 text-emerald-400" />
              )}
              <span>{isGeneratingPdf ? 'Building PDF...' : 'Download PDF'}</span>
            </button>

            <button
              onClick={handlePrintFullDocument}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500 text-black text-xs font-black hover:bg-amber-400 transition-all whitespace-nowrap"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>
          </div>

        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 pt-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Sidebar / TOC Column (Desktop) */}
        <aside className="no-print hidden lg:block lg:col-span-4 space-y-6">
          <div className="bg-stone-950 border border-amber-500/10 rounded-2xl p-5 sticky top-24 space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-black uppercase tracking-wider text-white">Table of Contents</span>
              </div>
              <span className="text-[10px] font-mono text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full font-bold">
                Page {currentPage} of 30
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                placeholder="Search specs, chapters, APIs..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-stone-900 border border-stone-800 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => { triggerSelectionHaptic(); setSelectedCategory(cat); }}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all ${selectedCategory === cat ? 'bg-amber-500 text-black' : 'bg-stone-900 text-stone-400 hover:text-white'}`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Chapter List */}
            <div className="max-h-[550px] overflow-y-auto no-scrollbar space-y-1 pr-1">
              {filteredDocs.map(doc => {
                const isActive = doc.pageNumber === currentPage;
                const isBookmarked = bookmarks.includes(doc.pageNumber);

                return (
                  <button
                    key={doc.pageNumber}
                    onClick={() => handlePageChange(doc.pageNumber)}
                    className={`w-full text-left p-3 rounded-xl transition-all border flex items-start gap-3 ${isActive ? 'bg-amber-500/10 border-amber-500/40 text-amber-500' : 'bg-stone-900/50 border-stone-800/60 text-stone-400 hover:bg-stone-900 hover:text-stone-200'}`}
                  >
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${isActive ? 'bg-amber-500 text-black' : 'bg-stone-800 text-stone-400'}`}>
                      P.{doc.pageNumber}
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider truncate">
                          {doc.chapter}
                        </span>
                        {isBookmarked && <BookmarkCheck className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />}
                      </div>
                      <p className="text-xs font-bold truncate text-white leading-snug">
                        {doc.title}
                      </p>
                    </div>
                  </button>
                );
              })}

              {filteredDocs.length === 0 && (
                <div className="text-center py-8 text-stone-500 text-xs">
                  No matching documentation pages found.
                </div>
              )}
            </div>

          </div>
        </aside>

        {/* Reader Document Area (Center/Right Column) */}
        <main className="lg:col-span-8 space-y-6">
          
          {/* Progress Bar Header */}
          <div className="no-print bg-stone-950 border border-amber-500/10 rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase text-amber-500 tracking-wider">
                  {activeDoc.chapter}
                </span>
                <span className="text-stone-600">•</span>
                <span className="text-xs font-semibold text-stone-400">
                  {activeDoc.category}
                </span>
              </div>

              <button
                onClick={() => toggleBookmark(activeDoc.pageNumber)}
                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${bookmarks.includes(activeDoc.pageNumber) ? 'bg-amber-500/20 border-amber-500/40 text-amber-500' : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-white'}`}
              >
                {bookmarks.includes(activeDoc.pageNumber) ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                <span>{bookmarks.includes(activeDoc.pageNumber) ? 'Bookmarked' : 'Bookmark'}</span>
              </button>
            </div>

            {/* Reading Progress Line */}
            <div className="w-full bg-stone-900 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-amber-500 h-full transition-all duration-300"
                style={{ width: `${(currentPage / 30) * 100}%` }}
              />
            </div>
          </div>

          {/* Document Content Card */}
          <article className="bg-stone-950 border border-amber-500/10 rounded-3xl p-6 md:p-10 space-y-8 shadow-2xl print-card">
            
            {/* Chapter Header */}
            <header className="space-y-4 pb-6 border-b border-stone-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-amber-500 tracking-widest uppercase bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                  DOCUMENT PAGE {activeDoc.pageNumber} OF 30
                </span>
                <span className="text-xs font-mono text-stone-500">
                  CHAPTER {activeDoc.pageNumber < 10 ? `0${activeDoc.pageNumber}` : activeDoc.pageNumber}
                </span>
              </div>

              <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight leading-tight">
                {activeDoc.title}
              </h1>

              <p className="text-sm md:text-base font-medium text-amber-500/80 leading-relaxed italic">
                {activeDoc.subtitle}
              </p>
            </header>

            {/* Summary Box */}
            <div className="bg-stone-900/80 border border-amber-500/20 rounded-2xl p-5 space-y-2">
              <div className="flex items-center gap-2 text-amber-500 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>Executive Chapter Abstract</span>
              </div>
              <p className="text-xs md:text-sm text-stone-300 leading-relaxed">
                {activeDoc.summary}
              </p>
            </div>

            {/* Content Sections */}
            <div className="space-y-8">
              {activeDoc.content.sections.map((section, idx) => (
                <section key={idx} className="space-y-4">
                  <h2 className="text-lg md:text-xl font-bold text-white tracking-tight border-l-2 border-amber-500 pl-3">
                    {section.heading}
                  </h2>

                  {section.body && (
                    <p className="text-xs md:text-sm text-stone-300 leading-relaxed">
                      {section.body}
                    </p>
                  )}

                  {/* Bullet Points */}
                  {section.bullets && (
                    <ul className="space-y-2 bg-stone-900/40 p-4 rounded-xl border border-stone-800/60">
                      {section.bullets.map((b, bIdx) => (
                        <li key={bIdx} className="flex items-start gap-2 text-xs md:text-sm text-stone-300 leading-relaxed">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Structured Data Table */}
                  {section.table && (
                    <div className="overflow-x-auto no-scrollbar my-4 rounded-xl border border-stone-800">
                      <table className="w-full text-left text-xs text-stone-300">
                        <thead className="bg-stone-900 text-amber-500 font-bold uppercase tracking-wider text-[10px] border-b border-stone-800">
                          <tr>
                            {section.table.headers.map((h, hIdx) => (
                              <th key={hIdx} className="px-4 py-3">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-800/60 bg-stone-950/50">
                          {section.table.rows.map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-stone-900/50 transition-colors">
                              {row.map((cell, cIdx) => (
                                <td key={cIdx} className="px-4 py-3 font-mono text-[11px] whitespace-normal">
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Code Block / Blueprint Snippet */}
                  {section.codeBlock && (
                    <div className="rounded-xl overflow-hidden border border-stone-800 bg-stone-900 my-4">
                      <div className="bg-stone-950 px-4 py-2 border-b border-stone-800 flex items-center justify-between text-[10px] font-mono text-stone-400">
                        <span className="uppercase text-amber-500 font-bold">{section.codeBlock.language} Snippet</span>
                        <span>Formatted Code Block</span>
                      </div>
                      <pre className="p-4 overflow-x-auto text-xs font-mono text-emerald-400 bg-black/80 leading-relaxed">
                        <code>{section.codeBlock.code}</code>
                      </pre>
                    </div>
                  )}
                </section>
              ))}
            </div>

            {/* Chapter Footer Metadata */}
            <footer className="pt-6 border-t border-stone-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-stone-500">
              <div>
                <span>Category: <strong className="text-stone-300">{activeDoc.category}</strong></span>
              </div>
              <div className="font-mono text-[11px]">
                BharatKisanSmart Specification Matrix • Page {activeDoc.pageNumber} / 30
              </div>
            </footer>

          </article>

          {/* Bottom Pagination Controls */}
          <div className="no-print bg-stone-950 border border-amber-500/10 rounded-2xl p-4 flex items-center justify-between gap-2">
            
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${currentPage === 1 ? 'opacity-30 cursor-not-allowed bg-stone-900 text-stone-600' : 'bg-stone-900 text-stone-200 hover:bg-stone-800 hover:text-white border border-stone-800'}`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous Page</span>
            </button>

            <div className="flex items-center gap-2">
              <select
                value={currentPage}
                onChange={e => handlePageChange(Number(e.target.value))}
                className="bg-stone-900 border border-stone-800 text-amber-500 font-mono font-bold text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
              >
                {PROJECT_DOCS_DATA.map(doc => (
                  <option key={doc.pageNumber} value={doc.pageNumber}>
                    Page {doc.pageNumber}: {doc.chapter}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === 30}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${currentPage === 30 ? 'opacity-30 cursor-not-allowed bg-stone-900 text-stone-600' : 'bg-amber-500 text-black hover:bg-amber-400 font-black'}`}
            >
              <span>Next Page</span>
              <ChevronRight className="w-4 h-4" />
            </button>

          </div>

        </main>
      </div>

      {/* Mobile Table of Contents Modal/Drawer */}
      {showTocDrawer && (
        <div className="no-print fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md bg-stone-950 h-full p-6 overflow-y-auto space-y-4 border-l border-amber-500/20">
            
            <div className="flex items-center justify-between pb-4 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-white">30-Page Document Index</h3>
              </div>
              <button
                onClick={() => setShowTocDrawer(false)}
                className="px-3 py-1 rounded-lg bg-stone-900 text-stone-400 text-xs font-bold"
              >
                Close
              </button>
            </div>

            {/* Search Input in Mobile Drawer */}
            <div className="relative">
              <Search className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                placeholder="Search page titles or keywords..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-stone-900 border border-stone-800 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* List of Pages */}
            <div className="space-y-2">
              {filteredDocs.map(doc => (
                <button
                  key={doc.pageNumber}
                  onClick={() => {
                    handlePageChange(doc.pageNumber);
                    setShowTocDrawer(false);
                  }}
                  className={`w-full text-left p-3 rounded-xl border flex items-center gap-3 ${doc.pageNumber === currentPage ? 'bg-amber-500/10 border-amber-500/40 text-amber-500' : 'bg-stone-900/50 border-stone-800 text-stone-300'}`}
                >
                  <span className="text-xs font-mono font-bold bg-stone-800 px-2 py-1 rounded text-amber-500">
                    P.{doc.pageNumber}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] text-stone-500 uppercase font-bold block">{doc.chapter}</span>
                    <p className="text-xs font-bold truncate text-white">{doc.title}</p>
                  </div>
                </button>
              ))}
            </div>

          </div>
        </div>
      )}

      {/* Print View Rendered For All 30 Pages when window.print() is called */}
      <div className="hidden print:block print-container space-y-12 bg-white text-black p-8">
        <div className="text-center pb-8 border-b border-black">
          <h1 className="text-3xl font-black uppercase">BharatKisanSmart (AgriAssist)</h1>
          <p className="text-sm font-bold">Complete 30-Page System Specification & Technical Architecture</p>
          <p className="text-xs">Generated from AI Studio Applet Platform</p>
        </div>

        {PROJECT_DOCS_DATA.map(doc => (
          <section key={doc.pageNumber} className="page-break space-y-4 pt-6">
            <div className="border-b border-gray-400 pb-2">
              <span className="text-xs font-mono font-bold uppercase">{doc.chapter} • Page {doc.pageNumber} of 30</span>
              <h2 className="text-xl font-bold uppercase">{doc.title}</h2>
              <p className="text-xs italic">{doc.subtitle}</p>
            </div>

            <p className="text-xs leading-relaxed font-semibold">{doc.summary}</p>

            {doc.content.sections.map((sec, sIdx) => (
              <div key={sIdx} className="space-y-2 pt-2">
                <h3 className="text-sm font-bold border-l-2 border-black pl-2">{sec.heading}</h3>
                {sec.body && <p className="text-xs leading-relaxed">{sec.body}</p>}
                {sec.bullets && (
                  <ul className="list-disc pl-5 text-xs space-y-1">
                    {sec.bullets.map((b, idx) => <li key={idx}>{b}</li>)}
                  </ul>
                )}
                {sec.table && (
                  <table className="w-full text-xs border border-black my-2">
                    <thead>
                      <tr className="bg-gray-200">
                        {sec.table.headers.map((h, hIdx) => <th key={hIdx} className="border p-1">{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {sec.table.rows.map((r, rIdx) => (
                        <tr key={rIdx}>
                          {r.map((c, cIdx) => <td key={cIdx} className="border p-1">{c}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ))}
          </section>
        ))}
      </div>

    </div>
  );
};

export default ProjectDocs;
