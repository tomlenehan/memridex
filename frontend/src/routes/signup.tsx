import {ViewIcon, ViewOffIcon} from "@chakra-ui/icons";
import {
    Button,
    Center,
    Container,
    FormControl,
    FormErrorMessage,
    Icon,
    Image,
    Input,
    InputGroup,
    InputRightElement,
    Link,
    useBoolean,
} from "@chakra-ui/react";
import {Link as RouterLink, createFileRoute, redirect} from "@tanstack/react-router";
import {type SubmitHandler, useForm} from "react-hook-form";

import Logo from "../assets/images/memridex-text-logo.png";
import useAuth, {isLoggedIn} from "../hooks/useAuth";
import {emailPattern} from "../utils";

interface SignupFormData {
    email: string;
    password: string;
    full_name: string;
}

export const Route = createFileRoute("/signup")({
    component: Signup,
    beforeLoad: async () => {
        if (isLoggedIn()) {
            throw redirect({to: "/"});
        }
    },
});

function Signup() {
    const [show, setShow] = useBoolean();
    const {signupMutation, error, resetError} = useAuth();
    const {
        register,
        handleSubmit,
        formState: {errors, isSubmitting},
    } = useForm<SignupFormData>({
        mode: "onBlur",
        criteriaMode: "all",
        defaultValues: {
            email: "",
            password: "",
            full_name: "",
        },
    });

    const onSubmit: SubmitHandler<SignupFormData> = async (data) => {
        if (isSubmitting) return;

        resetError();

        try {
            await signupMutation.mutateAsync(data);
        } catch {
            // error is handled by useAuth hook
        }
    };

    return (
        <Container
            as="form"
            onSubmit={handleSubmit(onSubmit)}
            h="100vh"
            maxW="sm"
            alignItems="stretch"
            justifyContent="center"
            gap={4}
            centerContent
        >
            <Image
                src={Logo}
                alt="FastAPI logo"
                height="auto"
                maxW="2xs"
                alignSelf="center"
                mb={4}
            />
            <FormControl id="email" isInvalid={!!errors.email || !!error}>
                <Input
                    id="email"
                    {...register("email", {pattern: emailPattern})}
                    placeholder="Email"
                    type="email"
                    required
                />
                {errors.email && (
                    <FormErrorMessage>{errors.email.message}</FormErrorMessage>
                )}
            </FormControl>
            <FormControl id="full_name" isInvalid={!!errors.full_name}>
                <Input
                    id="full_name"
                    {...register("full_name", {required: "Full name is required"})}
                    placeholder="Full Name"
                    type="text"
                    required
                />
                {errors.full_name && (
                    <FormErrorMessage>{errors.full_name.message}</FormErrorMessage>
                )}
            </FormControl>
            <FormControl id="password" isInvalid={!!error}>
                <InputGroup>
                    <Input
                        {...register("password")}
                        type={show ? "text" : "password"}
                        placeholder="Password"
                        required
                    />
                    <InputRightElement
                        color="ui.dim"
                        _hover={{cursor: "pointer"}}
                    >
                        <Icon
                            onClick={setShow.toggle}
                            aria-label={show ? "Hide password" : "Show password"}
                        >
                            {show ? <ViewOffIcon/> : <ViewIcon/>}
                        </Icon>
                    </InputRightElement>
                </InputGroup>
                {error && <FormErrorMessage>{error}</FormErrorMessage>}
            </FormControl>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
                Sign Up
            </Button>
            <Center>
                <Link as={RouterLink} to="/login" color="blue.500">
                    Already have an account? Log in
                </Link>
            </Center>
        </Container>
    );
}

export default Signup;
