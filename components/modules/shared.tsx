'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type FieldErrors, type FieldValues } from 'react-hook-form';
import type { ZodTypeAny } from 'zod';
import { toast } from 'sonner';
import { CheckCircle2, Eye, LayoutGrid, Plus, ShieldAlert } from 'lucide-react';

import { designSystem, joinClasses } from '../../styles/design-system';
import type { ModuleDefinition, ModuleField } from '../../lib/module-registry';

type FormValues = Record<string, unknown>;

function badgeClass(status?: string) {
  if (status === 'live') return designSystem.classNames.badge.live;
  if (status === 'needs-wiring') return designSystem.classNames.badge.wire;
  return designSystem.classNames.badge.soon;
}

function placeholderForField(field: ModuleField) {
  if (field.placeholder) return field.placeholder;
  if (field.type === 'select') return `Choose ${field.label.toLowerCase()}`;
  if (field.type === 'textarea' || field.type === 'rich-text') return `Enter ${field.label.toLowerCase()}`;
  if (field.type === 'number') return '0';
  return `Enter ${field.label.toLowerCase()}`;
}

function messageFor(errors: FieldErrors<FormValues>, name: string) {
  const error = errors[name];
  if (!error) return null;
  const message = 'message' in error && error.message ? String(error.message) : 'This field is required.';
  return <p className="mt-1 text-xs text-rose-600 dark:text-rose-300">{message}</p>;
}

export interface ModuleCardShellProps {
  definition: ModuleDefinition;
  count?: number;
  trend?: number[];
  onAdd?: (definition: ModuleDefinition) => void;
  onOpen?: (definition: ModuleDefinition) => void;
  onView?: (definition: ModuleDefinition) => void;
  onAlert?: (definition: ModuleDefinition) => void;
}

function buildTrendPath(trend: number[]) {
  if (!trend.length) return '';
  const width = 100;
  const height = 40;
  const max = Math.max(...trend, 1);
  const min = Math.min(...trend, 0);
  const range = Math.max(max - min, 1);
  const step = width / Math.max(trend.length - 1, 1);
  return trend
    .map((value, index) => {
      const x = index * step;
      const y = height - ((value - min) / range) * (height - 4) - 2;
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');
}

export function ModuleCardShell({ definition, count = 0, trend = [], onAdd, onOpen, onView, onAlert }: ModuleCardShellProps) {
  const sparklinePath = buildTrendPath(trend);
  return (
    <article className={joinClasses(designSystem.classNames.shell.panelStrong, 'flex h-full flex-col gap-4 p-4')}>
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-base font-semibold text-slate-950 dark:text-slate-50">{definition.label}</h3>
            <span className={badgeClass(definition.status)}>{definition.status || 'draft'}</span>
          </div>
          <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
            {definition.description || definition.domainLabel || definition.category || 'Module workspace'}
          </p>
        </div>
        <span className={joinClasses(designSystem.classNames.shell.chip, 'border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200')}>
          <LayoutGrid className="h-3.5 w-3.5" />
          {definition.kind}
        </span>
      </header>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-[14px] border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/70">
          <div className="text-[11px] uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">Live Count</div>
          <div className="mt-1 text-xl font-semibold text-slate-950 dark:text-slate-50">{count}</div>
        </div>
        <div className="rounded-[14px] border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/70">
          <div className="text-[11px] uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">Submodules</div>
          <div className="mt-1 text-xl font-semibold text-slate-950 dark:text-slate-50">{definition.submodules.length}</div>
        </div>
        <div className="rounded-[14px] border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/70">
          <div className="text-[11px] uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">Fields</div>
          <div className="mt-1 text-xl font-semibold text-slate-950 dark:text-slate-50">{definition.fields.length}</div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
          <span>Submodules</span>
          <span>{definition.sourceLine ? `SMS-2.html:${definition.sourceLine}` : 'Source registry'}</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {definition.submodules.length ? definition.submodules.map(submodule => (
            <span key={submodule} className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
              {submodule}
            </span>
          )) : <span className="text-xs text-slate-500 dark:text-slate-400">No submodules recorded</span>}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button type="button" onClick={() => onAdd?.(definition)} className={designSystem.classNames.button.secondary}>
          <Plus className="h-4 w-4" />
          Add
        </button>
        <button type="button" onClick={() => (onView || onOpen)?.(definition)} className={designSystem.classNames.button.primary}>
          <Eye className="h-4 w-4" />
          View
        </button>
        <button type="button" onClick={() => onAlert?.(definition)} className={designSystem.classNames.button.secondary}>
          <ShieldAlert className="h-4 w-4" />
          Alert
        </button>
      </div>

      {trend.length > 0 ? (
        <div className="pt-2">
          <svg viewBox="0 0 100 40" className="h-10 w-full overflow-visible" aria-hidden="true">
            <defs>
              <linearGradient id={`trend-${definition.key}`} x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#20c7df" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
            </defs>
            <path d={sparklinePath} fill="none" stroke={`url(#trend-${definition.key})`} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      ) : null}
    </article>
  );
}

export interface ModuleFormShellProps {
  definition: ModuleDefinition;
  schema: ZodTypeAny;
  mode?: 'create' | 'edit';
  onSubmit?: (values: FormValues) => Promise<void> | void;
}

function baseValues(definition: ModuleDefinition): FormValues {
  const values: FormValues = {
    module_key: definition.key,
    record_title: definition.label,
    summary: definition.description || '',
    notes: '',
    metadata: {},
    payload: {},
    submodules: definition.submodules.slice(),
    module_status: definition.status || 'live',
    domain_key: definition.domainKey || '',
    domain_label: definition.domainLabel || '',
    renderer: definition.renderer || '',
    launch_type: definition.launchType || '',
  };

  for (const field of definition.fields) {
    if (field.type === 'checkbox') values[field.key] = false;
    else if (field.type === 'number') values[field.key] = 0;
    else if (field.type === 'select') values[field.key] = field.options?.[0] || '';
    else values[field.key] = '';
  }

  return values;
}

function FieldControl({
  definition,
  field,
  register,
  errors,
}: {
  definition: ModuleDefinition;
  field: ModuleField;
  register: ReturnType<typeof useForm<FormValues>>['register'];
  errors: FieldErrors<FormValues>;
}) {
  const id = `${definition.key}-${field.key}`;
  const inputClass = joinClasses(designSystem.classNames.input.base, field.type === 'checkbox' ? 'w-auto' : '');

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium text-slate-700 dark:text-slate-200">
        {field.label}
      </label>
      {field.type === 'textarea' || field.type === 'rich-text' ? (
        <textarea
          id={id}
          rows={4}
          className={designSystem.classNames.input.base}
          placeholder={placeholderForField(field)}
          {...register(field.key)}
        />
      ) : field.type === 'select' ? (
        <select id={id} className={designSystem.classNames.input.base} {...register(field.key)}>
          {!field.required ? <option value="">Select one</option> : null}
          {(field.options || []).map(option => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : field.type === 'checkbox' ? (
        <input id={id} type="checkbox" className={inputClass} {...register(field.key)} />
      ) : field.type === 'date' ? (
        <input id={id} type="date" className={designSystem.classNames.input.base} placeholder={placeholderForField(field)} {...register(field.key)} />
      ) : field.type === 'email' ? (
        <input id={id} type="email" className={designSystem.classNames.input.base} placeholder={placeholderForField(field)} {...register(field.key)} />
      ) : field.type === 'phone' ? (
        <input id={id} type="tel" className={designSystem.classNames.input.base} placeholder={placeholderForField(field)} {...register(field.key)} />
      ) : field.type === 'url' ? (
        <input id={id} type="url" className={designSystem.classNames.input.base} placeholder={placeholderForField(field)} {...register(field.key)} />
      ) : (
        <input
          id={id}
          type={field.type === 'number' ? 'number' : 'text'}
          className={designSystem.classNames.input.base}
          placeholder={placeholderForField(field)}
          {...register(
            field.key,
            field.type === 'number'
              ? {
                  setValueAs: value => (value === '' || value === null || value === undefined ? undefined : Number(value)),
                }
              : undefined,
          )}
        />
      )}
      {messageFor(errors, field.key)}
    </div>
  );
}

export function ModuleFormShell({ definition, schema, mode = 'create', onSubmit }: ModuleFormShellProps) {
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: baseValues(definition) });
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const submit = form.handleSubmit(async values => {
    setIsSubmitting(true);
    try {
      await onSubmit?.(values);
      toast.success(`${definition.label} saved`);
    } catch (error) {
      toast.error(`${definition.label} could not be saved`);
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <form onSubmit={submit} className={joinClasses(designSystem.classNames.shell.panelStrong, 'space-y-5 p-5')}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">{mode} module form</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-950 dark:text-slate-50">{definition.label}</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {definition.description || definition.category || definition.domainLabel || 'Module data entry'}
          </p>
        </div>
        <span className={badgeClass(definition.status)}>{definition.status || 'draft'}</span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FieldControl
          definition={definition}
          field={{ key: 'record_title', label: 'Record Title', type: 'text', required: true }}
          register={form.register}
          errors={form.formState.errors}
        />
        <FieldControl
          definition={definition}
          field={{ key: 'summary', label: 'Summary', type: 'textarea' }}
          register={form.register}
          errors={form.formState.errors}
        />
      </div>

      {definition.kind === 'architecture' ? (
        <div className="grid gap-4 md:grid-cols-2">
          <FieldControl
            definition={definition}
            field={{ key: 'module_status', label: 'Module Status', type: 'select', options: ['live', 'needs-wiring', 'coming-soon'] }}
            register={form.register}
            errors={form.formState.errors}
          />
          <FieldControl
            definition={definition}
            field={{ key: 'launch_type', label: 'Launch Type', type: 'text' }}
            register={form.register}
            errors={form.formState.errors}
          />
          <FieldControl
            definition={definition}
            field={{ key: 'domain_label', label: 'Domain', type: 'text' }}
            register={form.register}
            errors={form.formState.errors}
          />
          <FieldControl
            definition={definition}
            field={{ key: 'renderer', label: 'Renderer', type: 'text' }}
            register={form.register}
            errors={form.formState.errors}
          />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {definition.fields.map(field => (
            <FieldControl
              key={field.key}
              definition={definition}
              field={field}
              register={form.register}
              errors={form.formState.errors}
            />
          ))}
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
          <span>Submodules</span>
          <span>{definition.submodules.length}</span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {definition.submodules.map(submodule => (
            <label
              key={submodule}
              className="flex items-center gap-2 rounded-[14px] border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-200"
            >
              <input type="checkbox" checked readOnly className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
              <span>{submodule}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <button type="submit" className={designSystem.classNames.button.primary} disabled={isSubmitting}>
          {isSubmitting ? <CheckCircle2 className="h-4 w-4 animate-pulse" /> : <Plus className="h-4 w-4" />}
          {isSubmitting ? 'Saving…' : 'Save record'}
        </button>
      </div>
    </form>
  );
}
