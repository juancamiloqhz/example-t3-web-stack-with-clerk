import React from "react";
import { type NextPage } from "next";
import Head from "next/head";
import { SignInButton, SignOutButton, useUser } from "@clerk/clerk-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { toast } from "react-hot-toast";
import LoadingSpinner from "~/components/loading-spinner";
import { api, type RouterOutputs } from "~/utils/api";

dayjs.extend(relativeTime);

const CreatePlanWizard = () => {
  const [content, setContent] = React.useState("");

  const ctx = api.useContext();

  const { mutate, isLoading: isCreating } = api.plans.create.useMutation({
    onSuccess: () => {
      setContent("");
      void ctx.plans.getAll.invalidate();
    },
    onError: (err) => {
      const errorMessage = err?.data?.zodError?.fieldErrors.content;
      if (errorMessage && errorMessage[0]) {
        toast.error(errorMessage[0]);
      } else {
        toast.error("Failed to create plan! Please try again later.");
      }
    },
  });
  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    mutate({ content });
  }
  return (
    <form onSubmit={handleCreate} className="flex flex-col">
      <label htmlFor="content">Content</label>
      <textarea
        name="content"
        id="content"
        placeholder="Content"
        required
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={isCreating}
      />

      <button type="submit" disabled={isCreating}>
        Create Plan
      </button>
    </form>
  );
};

type PlanWithAuthor = RouterOutputs["plans"]["getAll"][number];

const PlanView = (props: PlanWithAuthor) => {
  const { plan, author } = props;
  return (
    <div key={plan.id} className="whitespace-pre-line">
      <p className="font-bold">{dayjs(plan.createdAt).fromNow()}</p>
      {plan.content}
    </div>
  );
};

const Home: NextPage = () => {
  const { user, isLoaded: userLoaded, isSignedIn } = useUser();

  const { data, isLoading: plansLoading } = api.plans.getAll.useQuery();

  // Return empty div if user isn't loaded
  if (!userLoaded) return <div />;

  if (plansLoading) return <LoadingScreen />;

  if (!data) return <div>Something went wrong</div>;

  return (
    <>
      <Head>
        <title>Create T3 App</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="fixed h-screen w-full bg-gradient-to-br from-violet-200 via-blue-50 to-rose-200 dark:from-cyan-950 dark:via-sky-950 dark:to-blue-950">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
          <h1 className="text-4xl font-bold">Fitness AI!</h1>
          {!isSignedIn ? <SignInButton /> : <SignOutButton />}
          {isSignedIn && <CreatePlanWizard />}
          <div className="flex flex-col space-y-4">
            {data?.map((fullPlan) => (
              <PlanView {...fullPlan} key={fullPlan.plan.id} />
            ))}
          </div>
        </div>
      </main>
    </>
  );
};

export default Home;

const LoadingScreen = () => {
  return (
    <div className="fixed flex h-screen w-screen items-center justify-center bg-gradient-to-br from-violet-200 via-blue-50 to-rose-200 dark:from-cyan-950 dark:via-sky-950 dark:to-blue-950">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
        <h1 className="text-4xl font-bold">Welcome to Fitness AI!</h1>
        <LoadingSpinner />
      </div>
    </div>
  );
};
