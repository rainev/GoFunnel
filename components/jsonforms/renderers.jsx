import {
  and,
  isBooleanControl,
  isControl,
  isEnumControl,
  isNumberControl,
  isStringControl,
  rankWith,
  schemaTypeIs
} from "@jsonforms/core";
import { withJsonFormsControlProps } from "@jsonforms/react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

function FieldShell({ label, description, children, errors }) {
  return (
    <div className="space-y-2 rounded-lg border border-border/70 bg-white/80 p-4">
      {label ? <Label className="text-sm font-semibold">{label}</Label> : null}
      {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
      {children}
      {errors ? <p className="text-xs text-destructive">{errors}</p> : null}
    </div>
  );
}

function TextControl(props) {
  const { data, handleChange, path, label, description, errors } = props;
  return (
    <FieldShell label={label} description={description} errors={errors}>
      <Input value={data || ""} onChange={(event) => handleChange(path, event.target.value)} />
    </FieldShell>
  );
}

function NumberControl(props) {
  const { data, handleChange, path, label, description, errors } = props;
  return (
    <FieldShell label={label} description={description} errors={errors}>
      <Input
        type="number"
        value={data ?? ""}
        onChange={(event) => handleChange(path, event.target.value === "" ? undefined : Number(event.target.value))}
      />
    </FieldShell>
  );
}

function EnumControl(props) {
  const { data, handleChange, path, label, description, errors, schema } = props;
  return (
    <FieldShell label={label} description={description} errors={errors}>
      <Select value={data || ""} onChange={(event) => handleChange(path, event.target.value)}>
        <option value="">Select one</option>
        {(schema.enum || []).map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </Select>
    </FieldShell>
  );
}

function BooleanControl(props) {
  const { data, handleChange, path, label, description, errors } = props;
  return (
    <FieldShell description={description} errors={errors}>
      <div className="flex items-center gap-3">
        <Checkbox checked={Boolean(data)} onCheckedChange={(value) => handleChange(path, Boolean(value))} />
        <Label>{label}</Label>
      </div>
    </FieldShell>
  );
}

function MultiSelectControl(props) {
  const { data, handleChange, path, label, description, errors, schema } = props;
  const values = Array.isArray(data) ? data : [];
  const options = schema?.items?.enum || [];

  const toggle = (value) => {
    if (values.includes(value)) {
      handleChange(
        path,
        values.filter((item) => item !== value)
      );
      return;
    }

    handleChange(path, [...values, value]);
  };

  return (
    <FieldShell label={label} description={description} errors={errors}>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((value) => (
          <label key={value} className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm">
            <Checkbox checked={values.includes(value)} onCheckedChange={() => toggle(value)} />
            <span>{value}</span>
          </label>
        ))}
      </div>
    </FieldShell>
  );
}

export const shadcnRenderers = [
  { tester: rankWith(6, isEnumControl), renderer: withJsonFormsControlProps(EnumControl) },
  {
    tester: rankWith(7, and(isControl, schemaTypeIs("array"))),
    renderer: withJsonFormsControlProps(MultiSelectControl)
  },
  { tester: rankWith(5, isStringControl), renderer: withJsonFormsControlProps(TextControl) },
  { tester: rankWith(5, isNumberControl), renderer: withJsonFormsControlProps(NumberControl) },
  { tester: rankWith(5, isBooleanControl), renderer: withJsonFormsControlProps(BooleanControl) }
];
