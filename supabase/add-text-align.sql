-- Add text_align field to items table
alter table public.items 
add column if not exists text_align text not null default 'left' check (text_align in ('left', 'center', 'justify'));
