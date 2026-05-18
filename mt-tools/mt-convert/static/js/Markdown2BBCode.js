(function () {
    'use strict';

    class Markdown2BBCode {
        constructor() {
            this.rules = [];
            this._initRules();
        }

        _initRules() {
            this.addRule(/^######\s+(.+)$/gm, '[size=1][b]$1[/b][/size]');
            this.addRule(/^#{5}\s+(.+)$/gm, '[size=2][b]$1[/b][/size]');
            this.addRule(/^#{4}\s+(.+)$/gm, '[size=3][b]$1[/b][/size]');
            this.addRule(/^#{3}\s+(.+)$/gm, '[size=4][b]$1[/b][/size]');
            this.addRule(/^#{2}\s+(.+)$/gm, '[size=5][b]$1[/b][/size]');
            this.addRule(/^#\s+(.+)$/gm, '[size=6][b]$1[/b][/size]');

            this.addRule(/<(https?:\/\/[^>]+)>/gi, '[url=$1]$1[/url]');
            this.addRule(/<([\w.-]+@[\w.-]+\.\w+)>/gi, '[email]$1[/email]');

            this.addRule(/\*\*\*(.+?)\*\*\*/g, '[b][i]$1[/i][/b]');
            this.addRule(/___(.+?)___/g, '[b][i]$1[/i][/b]');

            this.addRule(/\*\*(.+?)\*\*/g, '[b]$1[/b]');
            this.addRule(/__(.+?)__/g, '[b]$1[/b]');

            this.addRule(/\*(.+?)\*/g, '[i]$1[/i]');
            this.addRule(/_([^_]+)_/g, '[i]$1[/i]');

            this.addRule(/~~(.+?)~~/g, '[s]$1[/s]');

            this.addRule(/==(.+?)==/g, '[color=#000000][backcolor=#FFFF00]$1[/backcolor][/color]');

            this.addRule(/`([^`]+)`/g, '[color=#333333][backcolor=#f4f4f4]$1[/backcolor][/color]');

            this.addRule(/\[([^\]]+)\]\(([^)]+?)(?:\s+"[^"]+")?\)/g, '[url=$2]$1[/url]');

            this.addRule(/^---$/gm, '[hr]');

            this.addRule(/\\(`|\*|_|\\|\[|\]|\(|\)|\#|\+|\-|\.|\!)/g, '$1');
        }

        addRule(pattern, replacement) {
            if (typeof replacement === 'function') {
                this.rules.push({ regex: pattern, replacement: replacement, isFunction: true });
            } else {
                this.rules.push({ regex: pattern, replacement: replacement, isFunction: false });
            }
        }

        convert(markdown) {
            if (!markdown || typeof markdown !== 'string') {
                return '';
            }

            const segments = markdown.split(/```(\w*)\n([\s\S]*?)```/);
            const parts = [];

            for (let i = 0; i < segments.length; i++) {
                if (i % 3 === 0) {
                    if (segments[i]) {
                        parts.push(this._processText(segments[i]));
                    }
                } else if (i % 3 === 2) {
                    parts.push(`[code]${segments[i].trim()}[/code]`);
                }
            }

            return this._cleanResult(parts.join('\n'));
        }

        _processText(text) {
            let result = text;

            result = this._processTables(result);
            result = this._processTaskLists(result);
            result = this._processImages(result);
            result = this._processQuotes(result);

            for (const rule of this.rules) {
                if (rule.isFunction) {
                    result = result.replace(rule.regex, rule.replacement);
                } else {
                    result = result.replace(rule.regex, rule.replacement);
                }
            }

            result = this._processUnorderedLists(result);
            result = this._processOrderedLists(result);

            return result;
        }

        _processImages(text) {
            text = text.replace(/!\[([^\]]*)\]\(([^)]+?)(?:\s+"[^"]+")?\)/g, (match, alt, url) => {
                return `[img]${url}[/img]`;
            });
            return text;
        }

        _processQuotes(text) {
            text = text.replace(/^\s*>\s?(.+)$/gm, '[quote]$1[/quote]');
            return text;
        }

        _processTables(text) {
            const lines = text.split('\n');
            const result = [];
            let inTable = false;
            let tableContent = [];

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];

                if (/^\|.+\|$/.test(line)) {
                    if (!inTable) {
                        inTable = true;
                        tableContent = [];
                    }

                    if (/^\|[\s-|]+\|$/.test(line)) {
                        continue;
                    }

                    const cells = line.split('|').filter(cell => cell !== '');
                    const bbcodeCells = cells.map(cell => {
                        return `[td]${cell.trim()}[/td]`;
                    }).join('');

                    tableContent.push(`[tr]${bbcodeCells}[/tr]`);
                } else {
                    if (inTable) {
                        result.push(`[table]${tableContent.join('')}[/table]`);
                        inTable = false;
                        tableContent = [];
                    }
                    result.push(line);
                }
            }

            if (inTable) {
                result.push(`[table]${tableContent.join('')}[/table]`);
            }

            return result.join('\n');
        }

        _processTaskLists(text) {
            text = text.replace(/^\s*- \[x\]\s+(.+)$/gm, '[*] ✓ $1');
            text = text.replace(/^\s*- \[\]\s+(.+)$/gm, '[*] ✗ $1');
            return text;
        }

        _processUnorderedLists(text) {
            const lines = text.split('\n');
            const result = [];
            let inList = false;
            let listItems = [];

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                const listMatch = line.match(/^\s*[*+-]\s+(.+)$/);

                if (listMatch) {
                    if (!inList) {
                        inList = true;
                        listItems = [];
                    }
                    listItems.push(`[*]${listMatch[1]}`);
                } else if (line.startsWith('[*]')) {
                    if (!inList) {
                        inList = true;
                        listItems = [];
                    }
                    listItems.push(line);
                } else {
                    if (inList) {
                        result.push(`[list]${listItems.join('')}[/list]`);
                        inList = false;
                        listItems = [];
                    }
                    result.push(line);
                }
            }

            if (inList) {
                result.push(`[list]${listItems.join('')}[/list]`);
            }

            return result.join('\n');
        }

        _processOrderedLists(text) {
            const lines = text.split('\n');
            const result = [];
            let inList = false;
            let listItems = [];

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                const listMatch = line.match(/^\d+\.\s+(.+)$/);

                if (listMatch) {
                    if (!inList) {
                        inList = true;
                        listItems = [];
                    }
                    listItems.push(`[*]${listMatch[1]}`);
                } else {
                    if (inList) {
                        result.push(`[list=1]${listItems.join('')}[/list]`);
                        inList = false;
                        listItems = [];
                    }
                    result.push(line);
                }
            }

            if (inList) {
                result.push(`[list=1]${listItems.join('')}[/list]`);
            }

            return result.join('\n');
        }

        _cleanResult(text) {
            text = text.replace(/\n{2,}/g, '\n');
            text = text.replace(/\[([a-z]+)\]\n+/gi, '[$1]');
            text = text.replace(/\n+\[\/([a-z]+)\]/gi, '[/$1]');

            text = text.replace(/([^\n])\n(\[list(=1)?\]|\[table\]|\[code\]|\[quote\])/gi, '$1\n$2');
            text = text.replace(/(\[\/list\]|\[\/table\]|\[\/code\]|\[\/quote\])\n([^\n])/gi, '$1\n$2');

            return text.trim();
        }

        init() {
            console.log('Markdown2BBCode initialized');
        }
    }

    window.Markdown2BBCode = Markdown2BBCode;

    if (!window.markdown2Bbcode) {
        window.markdown2Bbcode = new Markdown2BBCode();
    }

})();