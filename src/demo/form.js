import { useCallback, useRef } from "react";
import { Form, FormItem  } from "../components/form";

export default function FormDemo() {
  const formRef = useRef(null);

  const onSubmit = useCallback(() => {
    formRef.current.submit()
  },[])

  return (
    <div>
      <h1>form</h1>
      <Form 
        ref={formRef}
        initialValues={{foo: 'abc', age: 123}}>
        <FormItem name='foo'>
          <input></input>
        </FormItem>
        {/* <FormItem name='age'>
          <input></input>
        </FormItem> */}
      </Form>
      <button onClick={onSubmit}>提交</button>
    </div>
  )
}