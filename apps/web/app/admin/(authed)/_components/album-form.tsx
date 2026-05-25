"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { Album } from "@/lib/albums";
import type { MutationResult } from "@/lib/albums";
import { ALBUM_FORMATS } from "@/lib/album-schema";

type Props = {
  initial?: Album;
  action: (
    state: MutationResult | null,
    formData: FormData,
  ) => Promise<MutationResult>;
  submitLabel: string;
};

const labelClass = "block text-xs text-[var(--muted)] mb-1 uppercase tracking-widest";
const inputClass =
  "w-full bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] text-sm px-3 py-2 rounded focus:outline-none focus:border-[var(--accent)]";

export function AlbumForm({ initial, action, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState<MutationResult | null, FormData>(
    action,
    null,
  );
  const [coverPreview, setCoverPreview] = useState(initial?.coverImageUrl ?? "");
  const [previewBroken, setPreviewBroken] = useState(false);

  const fieldErrors = state?.ok === false ? state.fieldErrors ?? {} : {};

  return (
    <form action={formAction} className="space-y-5">
      <Field
        name="title"
        label="title"
        defaultValue={initial?.title}
        errors={fieldErrors.title}
        required
      />
      <Field
        name="artist"
        label="artist"
        defaultValue={initial?.artist}
        errors={fieldErrors.artist}
        required
      />

      <div className="grid grid-cols-2 gap-4">
        <Field
          name="year"
          label="year"
          defaultValue={initial?.year?.toString() ?? ""}
          errors={fieldErrors.year}
          type="number"
          inputMode="numeric"
        />
        <Field
          name="genre"
          label="genre"
          defaultValue={initial?.genre ?? ""}
          errors={fieldErrors.genre}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="format" className={labelClass}>format</label>
          <select
            id="format"
            name="format"
            defaultValue={initial?.format ?? "vinyl"}
            className={inputClass}
          >
            {ALBUM_FORMATS.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
          <FieldError errors={fieldErrors.format} />
        </div>

        <div>
          <label htmlFor="rating" className={labelClass}>rating</label>
          <select
            id="rating"
            name="rating"
            defaultValue={initial?.rating?.toString() ?? ""}
            className={inputClass}
          >
            <option value="">—</option>
            {[1, 2, 3, 4, 5].map((r) => (
              <option key={r} value={r}>{"★".repeat(r)}</option>
            ))}
          </select>
          <FieldError errors={fieldErrors.rating} />
        </div>
      </div>

      <Field
        name="label"
        label="label"
        defaultValue={initial?.label ?? ""}
        errors={fieldErrors.label}
      />

      <div>
        <label htmlFor="coverImageUrl" className={labelClass}>cover image url</label>
        <input
          id="coverImageUrl"
          name="coverImageUrl"
          type="url"
          defaultValue={initial?.coverImageUrl ?? ""}
          onChange={(e) => {
            setCoverPreview(e.target.value);
            setPreviewBroken(false);
          }}
          className={inputClass}
        />
        <FieldError errors={fieldErrors.coverImageUrl} />
        {coverPreview && !previewBroken && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverPreview}
            alt="cover preview"
            onError={() => setPreviewBroken(true)}
            className="mt-3 w-32 h-32 object-cover border border-[var(--border)] rounded"
          />
        )}
      </div>

      <div>
        <label htmlFor="notes" className={labelClass}>notes</label>
        <textarea
          id="notes"
          name="notes"
          rows={4}
          defaultValue={initial?.notes ?? ""}
          className={inputClass}
        />
        <FieldError errors={fieldErrors.notes} />
      </div>

      {state?.ok === false && (
        <p className="text-sm text-red-400">&gt; {state.error}</p>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="text-sm border border-[var(--border)] text-[var(--foreground)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-colors px-4 py-2 rounded disabled:opacity-50"
        >
          {pending ? "$ saving..." : `$ ${submitLabel}`}
        </button>
        <Link
          href="/admin"
          className="text-sm text-[var(--muted)] hover:text-[var(--accent)] transition-colors"
        >
          cancel
        </Link>
      </div>
    </form>
  );
}

function Field({
  name,
  label,
  defaultValue,
  errors,
  type = "text",
  inputMode,
  required = false,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
  errors?: string[];
  type?: string;
  inputMode?: "numeric";
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className={labelClass}>
        {label}
        {required && <span className="text-[var(--accent)] ml-1">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        inputMode={inputMode}
        defaultValue={defaultValue ?? ""}
        required={required}
        className={inputClass}
      />
      <FieldError errors={errors} />
    </div>
  );
}

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="text-xs text-red-400 mt-1">{errors[0]}</p>;
}
