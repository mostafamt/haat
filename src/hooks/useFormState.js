import { useState } from 'react';

export function useFormState(initial) {
  const [form, setForm]     = useState(initial);
  const [errors, setErrors] = useState({});

  const resetForm = () => {
    setForm(initial);
    setErrors({});
  };

  return { form, setForm, errors, setErrors, resetForm };
}
