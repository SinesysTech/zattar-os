/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Mock for the unified `radix-ui` package.
 *
 * The `radix-ui` v1.4.3 package re-exports from individual `@radix-ui/*` packages,
 * but its `source` field causes ts-jest to resolve to TypeScript source files
 * which break the `createDialogScope`/`createCollapsibleScope` internal APIs.
 *
 * This mock re-exports directly from the individual CJS dist packages.
 */
module.exports = {
    get Dialog() { return require('@radix-ui/react-dialog'); },
    get AlertDialog() { return require('@radix-ui/react-alert-dialog'); },
    get Accordion() { return require('@radix-ui/react-accordion'); },
    get Avatar() { return require('@radix-ui/react-avatar'); },
    get Checkbox() { return require('@radix-ui/react-checkbox'); },
    get Collapsible() { return require('@radix-ui/react-collapsible'); },
    get ContextMenu() { return require('@radix-ui/react-context-menu'); },
    get DropdownMenu() { return require('@radix-ui/react-dropdown-menu'); },
    get HoverCard() { return require('@radix-ui/react-hover-card'); },
    get Label() { return require('@radix-ui/react-label'); },
    get Menubar() { return require('@radix-ui/react-menubar'); },
    get NavigationMenu() { return require('@radix-ui/react-navigation-menu'); },
    get Popover() { return require('@radix-ui/react-popover'); },
    get Progress() { return require('@radix-ui/react-progress'); },
    get RadioGroup() { return require('@radix-ui/react-radio-group'); },
    get ScrollArea() { return require('@radix-ui/react-scroll-area'); },
    get Select() { return require('@radix-ui/react-select'); },
    get Separator() { return require('@radix-ui/react-separator'); },
    get Slider() { return require('@radix-ui/react-slider'); },
    get Slot() { return require('@radix-ui/react-slot'); },
    get Switch() { return require('@radix-ui/react-switch'); },
    get Tabs() { return require('@radix-ui/react-tabs'); },
    get Toast() { return require('@radix-ui/react-toast'); },
    get Toggle() { return require('@radix-ui/react-toggle'); },
    get Toolbar() { return require('@radix-ui/react-toolbar'); },
    get Tooltip() { return require('@radix-ui/react-tooltip'); },
};
