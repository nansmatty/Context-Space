begin;

alter table chunks
alter column embedding type vector(1024);

commit;