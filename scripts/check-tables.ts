
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cxxdivtgeslrujpfpivs.supabase.co';
const SUPABASE_KEY = 'sb_secret_5IOk8AZQTxNs99VFDVvTIg_q7I9iY6F';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkTables() {
    console.log('Checking tables...');

    // Check todo_items count
    const { count: todoCount, error: todoError } = await supabase
        .from('todo_items')
        .select('*', { count: 'exact', head: true });

    if (todoError) console.error('Error checking todo_items:', todoError.message);
    else console.log('todo_items count:', todoCount);

    // Check tarefas count
    const { count: tarefasCount, error: tarefasError } = await supabase
        .from('tarefas')
        .select('*', { count: 'exact', head: true });

    if (tarefasError) {
        console.error('Error checking tarefas:', tarefasError.message);
        if (tarefasError.message.includes('does not exist')) {
            console.log('Table "tarefas" does not exist.');
        }
    } else {
        console.log('tarefas count:', tarefasCount);
    }
}

checkTables();
