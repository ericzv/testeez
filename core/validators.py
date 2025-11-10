"""
Validadores de input para APIs
Simples e efetivo, sem dependências externas
"""

from typing import Any, Optional
from core.exceptions.game_exceptions import ValidationException


class Validator:
    """Validador base"""

    def __init__(self, field_name: str):
        self.field_name = field_name

    def validate(self, value: Any) -> Any:
        """Valida valor e retorna convertido ou levanta exceção"""
        raise NotImplementedError


class IntValidator(Validator):
    """Valida inteiros com ranges opcionais"""

    def __init__(self, field_name: str, min_value: Optional[int] = None,
                 max_value: Optional[int] = None, required: bool = True):
        super().__init__(field_name)
        self.min_value = min_value
        self.max_value = max_value
        self.required = required

    def validate(self, value: Any) -> Optional[int]:
        """
        Valida e converte para int.

        Raises:
            ValidationException: Se inválido
        """
        if value is None:
            if self.required:
                raise ValidationException(self.field_name, "campo obrigatório")
            return None

        # Tentar converter
        try:
            int_value = int(value)
        except (ValueError, TypeError):
            raise ValidationException(
                self.field_name,
                f"deve ser um número inteiro, recebido: {type(value).__name__}"
            )

        # Validar range
        if self.min_value is not None and int_value < self.min_value:
            raise ValidationException(
                self.field_name,
                f"deve ser >= {self.min_value}, recebido: {int_value}"
            )

        if self.max_value is not None and int_value > self.max_value:
            raise ValidationException(
                self.field_name,
                f"deve ser <= {self.max_value}, recebido: {int_value}"
            )

        return int_value


class StrValidator(Validator):
    """Valida strings com tamanhos opcionais"""

    def __init__(self, field_name: str, min_length: Optional[int] = None,
                 max_length: Optional[int] = None, required: bool = True):
        super().__init__(field_name)
        self.min_length = min_length
        self.max_length = max_length
        self.required = required

    def validate(self, value: Any) -> Optional[str]:
        """
        Valida e converte para string.

        Raises:
            ValidationException: Se inválido
        """
        if value is None or value == '':
            if self.required:
                raise ValidationException(self.field_name, "campo obrigatório")
            return None

        # Converter para string
        str_value = str(value)

        # Validar tamanho
        if self.min_length is not None and len(str_value) < self.min_length:
            raise ValidationException(
                self.field_name,
                f"tamanho mínimo: {self.min_length}, recebido: {len(str_value)}"
            )

        if self.max_length is not None and len(str_value) > self.max_length:
            raise ValidationException(
                self.field_name,
                f"tamanho máximo: {self.max_length}, recebido: {len(str_value)}"
            )

        return str_value


class BoolValidator(Validator):
    """Valida booleanos"""

    def __init__(self, field_name: str, required: bool = True):
        super().__init__(field_name)
        self.required = required

    def validate(self, value: Any) -> Optional[bool]:
        """
        Valida e converte para bool.

        Raises:
            ValidationException: Se inválido
        """
        if value is None:
            if self.required:
                raise ValidationException(self.field_name, "campo obrigatório")
            return None

        # Aceitar valores truthy/falsy
        if isinstance(value, bool):
            return value

        if isinstance(value, str):
            if value.lower() in ('true', '1', 'yes', 'sim'):
                return True
            if value.lower() in ('false', '0', 'no', 'não', 'nao'):
                return False

        if isinstance(value, int):
            return bool(value)

        raise ValidationException(
            self.field_name,
            f"deve ser booleano, recebido: {type(value).__name__}"
        )


class RequestValidator:
    """Valida requests completos"""

    def __init__(self, validators: dict):
        """
        Args:
            validators: Dict de {campo: Validator}

        Example:
            >>> validator = RequestValidator({
            ...     'skill_id': IntValidator('skill_id', min_value=1),
            ...     'player_id': IntValidator('player_id', min_value=1)
            ... })
        """
        self.validators = validators

    def validate(self, data: dict) -> dict:
        """
        Valida dict de dados.

        Args:
            data: Dict com dados a validar

        Returns:
            Dict validado e convertido

        Raises:
            ValidationException: Se algum campo inválido
        """
        validated = {}

        for field, validator in self.validators.items():
            value = data.get(field)
            validated[field] = validator.validate(value)

        return validated


# Validadores comuns pre-configurados

DAMAGE_BOSS_VALIDATOR = RequestValidator({
    'skill_id': IntValidator('skill_id', min_value=1, max_value=10000)
})

SELECT_ENEMY_VALIDATOR = RequestValidator({
    'enemy_id': IntValidator('enemy_id', min_value=1)
})

USE_SPECIAL_VALIDATOR = RequestValidator({
    'special_id': IntValidator('special_id', min_value=1, max_value=1000)
})
