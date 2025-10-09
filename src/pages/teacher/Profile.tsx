import { motion } from "framer-motion";
import profileLogo from "/profile-2.svg";
import teacherAuthService from "@/services/teacherAuth";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import type { Teacher } from "@/interfaces/ITeacher";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import plusIcon from "/plus-icon-2.svg";
import crossIcon from "/cross-icon-2.svg";
import DetailRow from "@/components/common/DetailRow";
export default function Profile() {
  const { register, handleSubmit, setValue, reset } = useForm<Teacher>();
  const [teacherData, setTeacherData] = useState<Teacher>();
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [subjects, setSubjects] = useState<string[]>([]);

  const teacherFetcher = async () => {
    const response = await teacherAuthService.getCurrentUser();
    if (!response) {
      toast.error(
        "Error while fetching user details! Please try again after some time"
      );
      return;
    }
    // console.log(response.data);
    setTeacherData(response.data.data);
  };
  useEffect(() => {
    teacherFetcher();
  }, []);

  const create = async (data: Teacher) => {
    let response;
    try {
      if (isEdit) {
        data.subjects = subjects;
        response = await teacherAuthService.editData(data);
        if (response)
          toast.success("Details updated successfully", {
            position: "bottom-center",
          });
      }
      reset();
      setSubjects([]);
      setIsEdit(false);
      teacherFetcher();
    } catch (error) {
      console.log(error);
    }
  };

  const handleEditClick = async () => {
    if (isEdit === false) {
      setIsEdit(true);
    }
    const response = await teacherAuthService.getCurrentUser();
    if (!response) {
      return;
    }
    const foundTeacher = response.data.data;
    // console.log("Found Teacher", foundTeacher);

    setValue("_id", foundTeacher._id);
    setValue("description", foundTeacher.description);
    setValue("upi_id", foundTeacher.upi_id);
    setSubjects(foundTeacher.subjects);
  };

  const handleAddSubject = () => {
    setSubjects([...subjects, ""]);
  };

  const handleRemoveSubject = (index: number) => {
    const updatedSubjects = subjects.filter((_, i) => i !== index);
    setSubjects(updatedSubjects);
  };

  const handleSubjectChange = (index: number, value: string) => {
    const updatedSubjects: string[] = [...subjects];
    updatedSubjects[index] = value;
    setSubjects(updatedSubjects);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="min-h-dvh flex flex-col items-center justify-center gap-10 bg-gradient-to-br from-darkest via-darker to-lighter py-24 px-6"
    >
      <motion.h1
        initial={{ y: -15, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-white text-center text-5xl font-light tracking-wide"
      >
        Your Details
      </motion.h1>

      {/* Glassmorphic Card */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="w-full max-w-4xl bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-10 flex flex-col lg:flex-row items-center gap-10 text-white"
      >
        <div className="bg-lightest/30 border border-white/20 p-6 rounded-2xl shadow-lg flex justify-center items-center">
          <img
            src={profileLogo}
            alt="profile"
            className="w-[180px] hover:scale-105 transition-transform duration-300"
          />
        </div>

        {teacherData && (
          <div className="flex flex-col gap-4 w-full">
            <DetailRow label="Username" value={teacherData.username} />
            <DetailRow label="Email" value={teacherData.email} />
            <DetailRow label="UPI ID" value={teacherData.upi_id} />

            <Accordion
              type="single"
              collapsible
              className="border-b border-white/20"
              defaultValue="item-1"
            >
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-xl font-semibold text-white hover:text-blue-300 transition">
                  Description
                </AccordionTrigger>
                <AccordionContent className="text-gray-200 text-lg font-light">
                  {teacherData.description
                    ? teacherData.description
                    : "No description added"}
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <Accordion
              type="single"
              collapsible
              className="border-b border-white/20"
              defaultValue="item-1"
            >
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-xl font-semibold text-white hover:text-blue-300 transition">
                  Subjects
                </AccordionTrigger>
                <AccordionContent className="text-gray-200 text-lg font-light space-y-1">
                  {teacherData.subjects && teacherData.subjects.length > 0 ? (
                    teacherData.subjects.map(
                      (subject: string, index: number) => (
                        <p key={index}>• {subject}</p>
                      )
                    )
                  ) : (
                    <p>No subjects added</p>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        )}
      </motion.div>

      {/* Edit Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="w-full max-w-md"
      >
        <Dialog>
          <DialogTrigger
            onClick={() => handleEditClick()}
            className="w-full bg-gradient-to-r from-lighter to-lightest text-white text-lg py-4 rounded-xl shadow-md hover:shadow-lg hover:scale-[0.98] transition-all font-light tracking-wide"
          >
            Edit Details
          </DialogTrigger>

          <DialogContent className="bg-darkest border border-white/20 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-semibold text-center">
                Edit Details
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit(create)} className="mt-4 space-y-3">
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  {...register("description")}
                  className="bg-white/10 border-white/20 text-white mt-3"
                />
              </div>

              <div>
                <Label htmlFor="upi_id">UPI ID</Label>
                <Input
                  id="upi_id"
                  type="text"
                  {...register("upi_id")}
                  className="bg-white/10 border-white/20 text-white mt-3"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Subjects</Label>
                <button
                  type="button"
                  onClick={handleAddSubject}
                  className="hover:scale-110 transition"
                >
                  <img src={plusIcon} alt="Add" className="w-[22px]" />
                </button>
              </div>

              {subjects.map((subject: string, index: number) => (
                <div key={index} className="flex items-center gap-3">
                  <Input
                    value={subject}
                    onChange={(e) => handleSubjectChange(index, e.target.value)}
                    className="bg-white/10 border-white/20 text-white"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveSubject(index)}
                    className="hover:scale-110 transition"
                  >
                    <img src={crossIcon} alt="Remove" className="w-[25px]" />
                  </button>
                </div>
              ))}

              <DialogFooter>
                <Button
                  type="submit"
                  className="mt-4 w-full bg-gradient-to-r from-[#1B1A55] to-[#535C91] hover:opacity-90 text-white rounded-xl py-2"
                >
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </motion.div>
    </motion.div>
  );
}
