import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL!;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY!;

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
```

---

## 4. Criar o arquivo `.env`

Na raiz do projeto:
```
VITE_SUPABASE_URL=https://bynbnyjaxlhnyjjlywlm.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_87Xz44oNZxaImpR4GUgzmw_qucwIvyW