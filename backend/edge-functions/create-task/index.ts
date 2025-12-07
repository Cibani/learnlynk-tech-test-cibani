// LearnLynk Tech Test - Task 3: Edge Function create-task

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

type CreateTaskPayload = {
  application_id: string;
  task_type: string;
  due_at: string;
};

const VALID_TYPES = ["call", "email", "review"];

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = (await req.json()) as Partial<CreateTaskPayload>;
    const { application_id, task_type, due_at } = body;

    // DONE: validated application_id, task_type, due_at
    // - checked task_type in VALID_TYPES
    // - parsed due_at and ensure it's in the future

    //Basic presence validation
    if(!application_id || !task_type || !due_at){
      return new Response(
        JSON.stringify({
          error: "Missing required fields: application_id, task_type, due_at"
          
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json"},
        },
      );
    }

    //validate task_type
    if(!VALID_TYPES.includes(task_type)){
      return new Response(
        JSON.stringify({
          error: "Invalid task_type. Must be one of: call, email, review",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json"
          },
        },
      );
    }

    //validate due_at is a valid ISO date and in the future
    const dueDate=new Date(due_at);
    if(Number.isNaN(dueDate.getTime())){
      return new Response(
        JSON.stringify({
          error: "Invalid due_at. Must be a valid ISO datetime string"
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json"
          },
        },
      );
    }
    //to check if the due date is at the future
    const now =new Date();
    if(dueDate<=now){
      return new Response(
        JSON.stringify({
          error: "due_at must be in the future",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json"
          },
        },
     );
    }
    // DONE: inserted into tasks table using supabase client
    //First, we need to fetch the application to get its tenant_id
    const {data: application, error: applicationError}=await supabase
    .from("applications")
    .select("id, tenant_id")
    .eq("id", application_id)
    .single();

    if(applicationError || !application){
      return new Response(
        JSON.stringify({error: "Application not found"}),
        {status:400, headers:{"Content-Type":"application/json"}},
      );
    }
    const{data, error}=await supabase.from("tasks").insert({
      tenant_id: application.tenant_id,
      application_id: application.id,
      type: task_type,
      due_at,
      status: "open",
    }).select("id").single();

    // DONE: handled error and returned appropriate status code
    if(error || !data){
      console.error("Error inserting task: ", error);
      return new Response(
        JSON.stringify({
          error: "Failed to create task"
        }),
        {
          status: 500,
          headers: {"Content-Type": "application/json"},
        },
      );
    }

    //Emit realtime event
    try{
      const channel=supabase.channel("tasks");
      await channel.subscribe();
      await channel.send({
        type: "broadcast",
        event: "task.created",
        payload: {task_id: data.id, application_id},
      });
    } catch (rtError){
      console.error("Failed to send realtime event: ", rtError);
    }
    
    return new Response(
      JSON.stringify({
        success: true, task_id: data.id
      }),
      {
        status: 200,
        headers: {"Content-Type":"application/json"},
      },
    );
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
