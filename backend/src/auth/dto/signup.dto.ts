import { IsEmail, IsString, MinLength } from 'class-validator';

export class SignupDto {
  @IsString()
  first_name: string;

  @IsString()
  last_name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  promo: string;

  @IsString()
  specialty: string;
}
