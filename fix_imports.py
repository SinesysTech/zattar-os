
import os

# Mapping of old path substrings to new path substrings
# We use key-value pairs where key is the import path end, and value is the new path.
# Order matters: more specific first if overlaps exist.

replacements = {
    # Calendar
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

    # UI / Shared / Layout
    '@/components/avatar-group': '@/components/ui/avatar-group',
    '@/components/avatar-stack': '@/components/ui/avatar-stack',
    '@/components/button-group': '@/components/ui/button-group',
    '@/components/current-user-avatar': '@/components/ui/current-user-avatar',
    '@/components/animations': '@/components/ui/animations',
    '@/components/command-menu': '@/components/layout/command-menu',
    '@/components/user-select': '@/components/shared/user-select',
    '@/components/responsive-modal': '@/components/shared/responsive-modal',
    '@/components/docs/': '@/components/layout/docs/',

    # Chat / Realtime / PWA
    '@/components/chat-': '@/components/chat/chat-',
    '@/components/use-chat': '@/components/chat/use-chat',
    '@/components/cursor': '@/components/realtime/cursor',
    '@/components/realtime-': '@/components/realtime/realtime-',
    '@/components/pwa-install-prompt': '@/components/pwa/pwa-install-prompt',

    # Features
    '@/components/documentos/': '@/features/documentos/components/',
    '@/components/financeiro/': '@/features/financeiro/components/',
    '@/components/modules/audiencias/': '@/features/audiencias/components/',
    '@/components/modules/dashboard/': '@/features/dashboard/components/',
    
    # Editor (Plate)
    '@/components/plate/': '@/components/editor/plate/',
    '@/components/plate-ui/': '@/components/editor/plate-ui/'
}

hooks_replacements = {
    # Special handling for hooks if they were imported from @/components/hooks
    # This might need manual check, but let's try strict replace
    '@/components/hooks': '@/components/hooks_REMOVED_CHECK_MANUALLY' 
}

root_dir = 'src'

for subdir, dirs, files in os.walk(root_dir):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            filepath = os.path.join(subdir, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            new_content = content
            for old, new in replacements.items():
                new_content = new_content.replace(old, new)
            
            if new_content != content:
                print(f"Updating {filepath}")
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)

print("Finished import updates.")
