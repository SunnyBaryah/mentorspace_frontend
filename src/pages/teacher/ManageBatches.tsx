import plusIcon from "/plus-icon-2.svg";
import crossIcon from "/cross-icon-2.svg";
// import Button from "@/components/common/Button";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import teacherAuthService from "@/services/teacherAuth";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import type { Batch } from "@/interfaces/IBatch";
import batchService from "@/services/batches";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import teacherStore from "@/store/teacherStore";

export default function ManageBatches() {
  const { register, handleSubmit, setValue, reset } = useForm<Batch>();
  const [batches, setBatches] = useState([]);
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [topics, setTopics] = useState<{ name: string }[]>([]);
  const { userData } = teacherStore();

  const batchesFetcher = async () => {
    const serviceResponse = await teacherAuthService.getBatches();
    setBatches(serviceResponse?.data.data);
  };

  const handleAddTopic = () => setTopics([...topics, { name: "" }]);
  const handleRemoveTopic = (index: number) =>
    setTopics(topics.filter((_, i) => i !== index));
  const handleTopicChange = (index: number, value: string) => {
    const updatedTopics = [...topics];
    updatedTopics[index].name = value;
    setTopics(updatedTopics);
  };

  const correctDateAndTime = (time: string) => {
    const localDate = new Date(time);
    return new Date(
      localDate.getTime() - localDate.getTimezoneOffset() * 60000
    ).toISOString();
  };

  const create = async (data: Batch) => {
    data.start_date = correctDateAndTime(data.start_date);
    data.end_date = correctDateAndTime(data.end_date);
    data.teacher = userData.id;

    try {
      let response;
      if (isEdit) {
        data.topics = topics;
        response = await batchService.updateBatch(data);
        await teacherAuthService.editBatch({
          name: data.name,
          batch_id: data._id,
        });
        toast.success("Batch updated successfully", {
          position: "bottom-center",
        });
      } else {
        data.topics = topics;
        response = await batchService.addBatch(data);
        if (!response) {
          toast.error("Not able to add the batch!");
          return;
        }
        await teacherAuthService.addBatch({ batch_id: response.data.data._id });
        toast.success("Batch added successfully");
      }
      reset();
      setTopics([]);
      setIsEdit(false);
      batchesFetcher();
    } catch (error) {
      console.log(error);
    }
  };

  const handleEditClick = async (id: string) => {
    if (!isEdit) setIsEdit(true);
    const response = await batchService.getBatch(id);
    if (!response) return;

    const foundBatch = response.data.data.foundBatch;
    const formatDateTimeLocal = (isoString: string): string =>
      isoString.slice(0, 16);
    if (foundBatch.topics) setTopics(foundBatch.topics);
    setValue("_id", foundBatch._id);
    setValue("name", foundBatch.name);
    setValue("price", foundBatch.price);
    setValue("description", foundBatch.description);
    setValue("start_date", formatDateTimeLocal(foundBatch.start_date));
    setValue("end_date", formatDateTimeLocal(foundBatch.end_date));
  };

  useEffect(() => {
    batchesFetcher();
  }, []);

  const clearDetails = () => {
    if (isEdit) setIsEdit(false);
    setTopics([]);
    reset();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-dvh flex flex-col items-center gap-10 bg-gradient-to-br from-[#070F2B] to-[#535C91] pt-28 pb-16 px-4"
    >
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-white text-4xl lg:text-5xl font-light tracking-tight">
          Your Batches
        </h1>
        <p className="text-gray-300 text-base lg:text-lg font-light">
          Manage all your batches and lessons in one place.
        </p>
      </div>

      {/* Add Batch */}
      <Dialog>
        <DialogTrigger
          onClick={clearDetails}
          className="bg-lighter hover:bg-darker w-4/5 md:w-2/5 lg:w-1/5 text-inputBG font-light py-4 rounded-lg lg:text-2xl hover:scale-95  transition"
        >
          + Add New Batch
        </DialogTrigger>
        <DialogContent className="bg-darkest text-white border-0 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold">
              {isEdit ? "Edit Batch" : "Add a Batch"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(create)} className="space-y-3 mt-2">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                {...register("name", { required: true })}
                className="bg-[#535C91] text-white border-0 mt-2"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                {...register("description")}
                className="bg-[#535C91] text-white border-0 mt-2"
              />
            </div>
            <div>
              <Label htmlFor="price">Price</Label>
              <Input
                type="number"
                id="price"
                {...register("price")}
                className="bg-[#535C91] text-white border-0 mt-2"
              />
            </div>
            <div>
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                type="datetime-local"
                id="start_date"
                {...register("start_date", { required: true })}
                className="bg-[#535C91] text-white border-0 mt-2"
              />
            </div>
            <div>
              <Label htmlFor="end_date">End Date</Label>
              <Input
                type="datetime-local"
                id="end_date"
                {...register("end_date", { required: true })}
                className="bg-[#535C91] text-white border-0 mt-2"
              />
            </div>

            {/* Topics */}
            <div className="flex items-center gap-2">
              <Label>Topics</Label>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleAddTopic();
                }}
                className="hover:scale-110 transition-transform"
              >
                <img className="w-[20px]" src={plusIcon} alt="Add topic" />
              </button>
            </div>
            {topics.map((topic, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={topic.name}
                  onChange={(e) => handleTopicChange(index, e.target.value)}
                  className="bg-[#535C91] text-white border-0"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleRemoveTopic(index);
                  }}
                  className="hover:scale-110 transition-transform"
                >
                  <img
                    className="w-[25px]"
                    src={crossIcon}
                    alt="Remove topic"
                  />
                </button>
              </div>
            ))}

            <Button
              className="mt-4 w-full bg-[#9BA4B5] hover:bg-[#B8C1D1] text-[#070F2B] py-2 rounded-md font-medium shadow-md transition"
              type="submit"
            >
              Save Changes
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Batch List */}
      <div className="w-full">
        {batches && batches.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-5 w-full sm:w-4/5 lg:w-3/5 xl:w-2/5 mx-auto bg-[#E5E7EB]/10 backdrop-blur-md rounded-2xl p-6 shadow-inner">
            {batches.map(
              (batch: { _id: string; name: string; price: number }, ind) => (
                <Dialog key={ind}>
                  <DialogTrigger
                    className="sm:w-5/6 lg:w-4/5 bg-[#9BA4B5]/90 hover:bg-[#B8C1D1] flex flex-col sm:flex-row justify-between items-center text-[#070F2B] px-6 py-5 rounded-xl hover:scale-105 transition-all shadow-md"
                    onClick={() => handleEditClick(batch._id)}
                  >
                    <p className="text-lg font-semibold">{batch.name}</p>
                    <div className="flex flex-col sm:flex-row gap-3 mt-2 sm:mt-0">
                      <Link
                        className="bg-lighter text-white px-3 py-2 rounded-md hover:bg-[#0D1B4C] transition"
                        to={`${batch._id}/active-lesson`}
                      >
                        Take Lesson
                      </Link>
                      <Link
                        className="bg-darker text-white px-3 py-2 rounded-md hover:bg-[#27276C] transition"
                        to={`${batch._id}/lessons`}
                      >
                        Manage Lessons
                      </Link>
                    </div>
                  </DialogTrigger>

                  {/* Edit Dialog */}
                  <DialogContent className="bg-darkest text-white border-0 shadow-xl">
                    <DialogHeader>
                      <DialogTitle>Edit Batch Details</DialogTitle>
                    </DialogHeader>
                    <form
                      onSubmit={handleSubmit(create)}
                      className="space-y-3 mt-2"
                    >
                      <div>
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          {...register("name", { required: true })}
                          className="bg-[#535C91] text-white border-0 mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Input
                          id="description"
                          {...register("description")}
                          className="bg-[#535C91] text-white border-0 mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="start_date">Start Date</Label>
                        <Input
                          id="start_date"
                          type="datetime-local"
                          {...register("start_date", { required: true })}
                          className="bg-[#535C91] text-white border-0 mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="end_date">End Date</Label>
                        <Input
                          id="end_date"
                          type="datetime-local"
                          {...register("end_date", { required: true })}
                          className="bg-[#535C91] text-white border-0 mt-2"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <Label>Topics</Label>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleAddTopic();
                          }}
                          className="hover:scale-110 transition-transform"
                        >
                          <img
                            className="w-[20px]"
                            src={plusIcon}
                            alt="Add topic"
                          />
                        </button>
                      </div>

                      {topics.map((topic, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input
                            value={topic.name}
                            onChange={(e) =>
                              handleTopicChange(index, e.target.value)
                            }
                            className="bg-[#535C91] text-white border-0"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleRemoveTopic(index);
                            }}
                            className="hover:scale-110 transition-transform"
                          >
                            <img
                              className="w-[25px]"
                              src={crossIcon}
                              alt="Remove topic"
                            />
                          </button>
                        </div>
                      ))}

                      <Button
                        className="mt-4 w-full bg-[#9BA4B5] hover:bg-[#B8C1D1] text-[#070F2B] py-2 rounded-md font-medium shadow-md transition"
                        type="submit"
                      >
                        Save Changes
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              )
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 gap-4 w-4/5 mx-auto bg-[#1B1A55]/60 rounded-2xl min-h-60 shadow-inner">
            <h2 className="text-white text-2xl lg:text-3xl font-light">
              No batches found!
            </h2>
            <p className="text-gray-400">
              Click “Add New Batch” to create your first one ✨
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
