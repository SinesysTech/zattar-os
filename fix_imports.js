
const fs = require('fs');
const path = require('path');

const replacements = {
    // Calendar
    '@/components/calendar-': '@/components/calendar/calendar-',
    '@/components/day-': '@/components/calendar/day-',
    '@/components/week-': '@/components/calendar/week-',
    '@/components/month-': '@/components/calendar/month-',
    '@/components/year-': '@/components/calendar/year-',
    '@/components/event-': '@/components/calendar/event-',
    '@/components/add-edit-event-dialog': '@/components/calendar/add-edit-event-dialog',
    '@/components/agenda-events': '@/components/calendar/agenda-events',
    '@/components/delete-event-dialog': '@/components/calendar/delete-event-dialog',
    '@/components/dnd-': '@/components/calendar/dnd-',
    '@/components/draggable-event': '@/components/calendar/draggable-event',
    '@/components/droppable-area': '@/components/calendar/droppable-area',
    '@/components/dropzone': '@/components/calendar/dropzone',
    '@/components/render-grouped-events': '@/components/calendar/render-grouped-events',
    '@/components/resizable-event': '@/components/calendar/resizable-event',
    '@/components/today-button': '@/components/calendar/today-button',
    '@/components/view-tabs': '@/components/calendar/view-tabs',
    '@/components/settings': '@/components/calendar/settings',
    '@/components/filter': '@/components/calendar/filter',
    '@/components/types': '@/components/calendar/types',
    '@/components/helpers': '@/components/calendar/helpers',
    '@/components/constants': '@/components/calendar/constants',
    '@/components/date-navigator': '@/components/calendar/date-navigator',
    '@/components/date-time-picker': '@/components/calendar/date-time-picker',
    '@/components/events-list-dialog': '@/components/calendar/events-list-dialog',
    '@/components/calendar-context': '@/components/calendar/calendar-context',
    '@/components/dnd-context': '@/components/calendar/dnd-context',
    '@/components/requests': '@/components/calendar/requests',
    '@/components/schemas': '@/components/calendar/schemas',
    '@/components/interfaces': '@/components/calendar/interfaces',
    '@/components/mocks': '@/components/calendar/mocks',
    '@/components/transforms': '@/components/calendar/transforms',
    '@/components/calendar"': '@/components/calendar/calendar"',
    '@/components/calendar\';': '@/components/calendar/calendar\';',

    // UI / Shared / Layout
    '@/components/avatar-group': '@/components/ui/avatar-group',
    '@/components/avatar-stack': '@/components/ui/avatar-stack',
    '@/components/button-group': '@/components/ui/button-group',
    '@/components/current-user-avatar': '@/components/ui/current-user-avatar',
    '@/components/animations': '@/components/ui/animations',
    '@/components/command-menu': '@/components/layout/command-menu',
    '@/components/user-select': '@/components/shared/user-select',
    '@/components/responsive-modal': '@/components/shared/responsive-modal',
    '@/components/docs/': '@/components/layout/docs/',

    // Chat / Realtime / PWA
    '@/components/chat-': '@/components/chat/chat-',
    '@/components/use-chat': '@/components/chat/use-chat',
    '@/components/cursor': '@/components/realtime/cursor',
    '@/components/realtime-': '@/components/realtime/realtime-',
    '@/components/pwa-install-prompt': '@/components/pwa/pwa-install-prompt',

    // Features
    '@/components/documentos/': '@/features/documentos/components/',
    '@/components/financeiro/': '@/features/financeiro/components/',
    '@/components/modules/audiencias/': '@/features/audiencias/components/',
    '@/components/modules/dashboard/': '@/features/dashboard/components/',

    // Editor
    '@/components/plate/': '@/components/editor/plate/',
    '@/components/plate-ui/': '@/components/editor/plate-ui/'
};

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('src');

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let newContent = content;

    for (const [oldPath, newPath] of Object.entries(replacements)) {
        newContent = newContent.split(oldPath).join(newPath);
    }

    if (newContent !== content) {
        console.log(`Updating ${file}`);
        fs.writeFileSync(file, newContent, 'utf8');
    }
});

console.log('Finished import updates.');
